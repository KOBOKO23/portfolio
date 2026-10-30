#!/usr/bin/env bash
# Bring the blog back from the final koboko-db snapshot (12 Sep 2026):
#   1. restore the snapshot to a temporary db.t4g.micro (not public; only the
#      portfolio host may connect),
#   2. on the host, pg_dump it and pg_restore into the local 'koboko' database
#      (infra/host/restore_from_rds.sh),
#   3. delete the temporary instance and its security group.
# The snapshot itself is kept. The temporary instance costs a few cents.
#
#   bash infra/aws/restore_blog_db.sh                  # dry run
#   DRY_RUN=false bash infra/aws/restore_blog_db.sh    # apply

source "$(dirname "$0")/lib.sh"
require_identity

SNAPSHOT="${SNAPSHOT:-final-koboko-db029d5732-113f-4754-a964-1541d12a4737}"
TMP_ID="${TMP_ID:-koboko-restore-tmp}"
TMP_SG_NAME="$PREFIX-restore-sg"
SUBNET_GROUP="${SUBNET_GROUP:-koboko-db-subnet-group}"
KEEP_TEMP="${KEEP_TEMP:-false}"

VPC_ID=$(q ec2 describe-vpcs --filters Name=isDefault,Values=true --query 'Vpcs[0].VpcId')
HOST_SG=$(q ec2 describe-security-groups --filters Name=vpc-id,Values="$VPC_ID" Name=group-name,Values="$PREFIX-host-sg" \
    --query 'SecurityGroups[0].GroupId')
[[ -n "$HOST_SG" || "$DRY_RUN" == "true" ]] || { log "Run infra/aws/provision.sh first (no $PREFIX-host-sg)."; exit 1; }

step "Temporary security group $TMP_SG_NAME (5432 from the portfolio host only)"
TMP_SG=$(q ec2 describe-security-groups --filters Name=vpc-id,Values="$VPC_ID" Name=group-name,Values="$TMP_SG_NAME" \
    --query 'SecurityGroups[0].GroupId')
if [[ -n "$TMP_SG" ]]; then
    have "$TMP_SG_NAME ($TMP_SG)"
else
    plan "$TMP_SG_NAME"
    if [[ "$DRY_RUN" == "true" ]]; then
        run aws ec2 create-security-group --group-name "$TMP_SG_NAME" --vpc-id "$VPC_ID" --description "..."
        TMP_SG="<$TMP_SG_NAME>"
    else
        TMP_SG=$(aws ec2 create-security-group --group-name "$TMP_SG_NAME" --vpc-id "$VPC_ID" \
            --description "Temporary: blog restore from snapshot" \
            --tag-specifications "$(ec2_tag_spec security-group "$TMP_SG_NAME")" --query GroupId --output text)
        aws ec2 authorize-security-group-ingress --group-id "$TMP_SG" \
            --ip-permissions "IpProtocol=tcp,FromPort=5432,ToPort=5432,UserIdGroupPairs=[{GroupId=$HOST_SG}]" >/dev/null
    fi
fi

step "Temporary RDS instance $TMP_ID from $SNAPSHOT"
status=$(q rds describe-db-instances --db-instance-identifier "$TMP_ID" --query 'DBInstances[0].DBInstanceStatus')
if [[ -n "$status" ]]; then
    have "$TMP_ID ($status)"
else
    plan "$TMP_ID db.t4g.micro, single AZ, not public, no backups, tagged"
    run aws rds restore-db-instance-from-db-snapshot --db-instance-identifier "$TMP_ID" \
        --db-snapshot-identifier "$SNAPSHOT" --db-instance-class db.t4g.micro \
        --db-subnet-group-name "$SUBNET_GROUP" --vpc-security-group-ids "$TMP_SG" \
        --no-publicly-accessible --no-multi-az --no-deletion-protection --backup-retention-period 0 \
        --tags "${TAGS_KV[@]}" Key=Name,Value="$TMP_ID" >/dev/null
fi
if [[ "$DRY_RUN" != "true" ]]; then
    log "   waiting for $TMP_ID (about 5-15 minutes)"
    aws rds wait db-instance-available --db-instance-identifier "$TMP_ID"
fi
ENDPOINT=$(q rds describe-db-instances --db-instance-identifier "$TMP_ID" --query 'DBInstances[0].Endpoint.Address')

step "Copy into the host's local database"
if [[ -z "$(host_instance_id)" ]]; then
    plan "pg_dump $TMP_ID -> pg_restore into local koboko on the host (host not created yet)"
elif ! bash "$(dirname "$0")/run_on_host.sh" "$(dirname "$0")/../host/restore_from_rds.sh" \
    TEMP_DB_HOST="${ENDPOINT:-pending}" DRY_RUN="$DRY_RUN"; then
    log "Copy failed — $TMP_ID is left running so you can retry: re-run this script (it skips finished steps)."
    exit 1
fi

step "Remove the temporary instance and security group"
if [[ "$KEEP_TEMP" == "true" ]]; then
    warn "KEEP_TEMP=true — $TMP_ID left running (about USD 0.02/hour); re-run without it to clean up"
else
    if [[ -n "$status" || "$DRY_RUN" != "true" ]]; then
        drop "$TMP_ID (no final snapshot — the original snapshot is untouched)"
        run aws rds delete-db-instance --db-instance-identifier "$TMP_ID" --skip-final-snapshot --delete-automated-backups >/dev/null
        [[ "$DRY_RUN" == "true" ]] || aws rds wait db-instance-deleted --db-instance-identifier "$TMP_ID"
    fi
    drop "$TMP_SG_NAME"
    run aws ec2 delete-security-group --group-id "$TMP_SG"
fi
[[ "$DRY_RUN" == "true" ]] && log "   Dry run only — nothing was changed."
exit 0
