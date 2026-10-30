#!/usr/bin/env bash
# Remove the old ECS/Fargate hosting for the portfolio backend once the EC2
# host is serving api.koboko.co.ke (~USD 37/month saved):
#   ECS service + cluster, ALB + target group (+ any Elastic IPs left on it),
#   CloudFront distribution in front of the ALB, old security groups and the
#   koboko-db subnet group.
# Kept: the ECR repository (CI still pushes there; a lifecycle rule keeps the
# last 10 images), the media bucket, the koboko/backend secret, the final
# koboko-db snapshot, the IAM roles. The log group gets 30-day retention.
#
# Refuses to run unless https://api.koboko.co.ke/api/health/ is answered by
# the new host (override with SKIP_CUTOVER_CHECK=true).
#
#   bash infra/aws/decommission_ecs.sh                  # dry run
#   DRY_RUN=false bash infra/aws/decommission_ecs.sh    # apply

source "$(dirname "$0")/lib.sh"
require_identity

CLUSTER=koboko-cluster
SERVICE=koboko-backend-svc
ALB=koboko-alb
TG=koboko-tg
CF_ID="${CF_ID:-E3SVB97L6Z4BDT}"
OLD_SGS=(koboko-ecs-sg koboko-alb-sg koboko-rds-sg)
LOG_GROUP=/ecs/koboko-backend
wait_real() { [[ "$DRY_RUN" == "true" ]] || "$@"; }

step "Cutover check"
eip=$(q ec2 describe-addresses --filters Name=tag:Name,Values="$HOST_NAME_TAG" --query 'Addresses[0].PublicIp')
resolved=$(dig +short "$API_DOMAIN" A | tail -1)
if [[ "${SKIP_CUTOVER_CHECK:-false}" != "true" ]]; then
    if [[ -z "$eip" || "$resolved" != "$eip" ]]; then
        log "   $API_DOMAIN resolves to '${resolved:-nothing}', the new host is '${eip:-not created}'."
        log "   Change DNS first (see infra/README.md); refusing to remove the old hosting."
        exit 1
    fi
    curl -fsS --max-time 10 "https://$API_DOMAIN/api/health/" >/dev/null ||
        { log "   https://$API_DOMAIN/api/health/ is not healthy on the new host yet; refusing."; exit 1; }
    have "$API_DOMAIN -> $eip and healthy"
fi

step "ECS service $SERVICE and cluster $CLUSTER"
if [[ "$(q ecs describe-services --cluster "$CLUSTER" --services "$SERVICE" --query 'services[0].status')" == ACTIVE ]]; then
    drop "service $SERVICE"
    run aws ecs update-service --cluster "$CLUSTER" --service "$SERVICE" --desired-count 0 >/dev/null
    run aws ecs delete-service --cluster "$CLUSTER" --service "$SERVICE" --force >/dev/null
    wait_real aws ecs wait services-inactive --cluster "$CLUSTER" --services "$SERVICE"
fi
if [[ "$(q ecs describe-clusters --clusters "$CLUSTER" --query 'clusters[0].status')" == ACTIVE ]]; then
    drop "cluster $CLUSTER"
    run aws ecs delete-cluster --cluster "$CLUSTER" >/dev/null
fi

step "Load balancer $ALB"
alb_arn=$(q elbv2 describe-load-balancers --names "$ALB" --query 'LoadBalancers[0].LoadBalancerArn')
if [[ -n "$alb_arn" ]]; then
    drop "$ALB"
    run aws elbv2 modify-load-balancer-attributes --load-balancer-arn "$alb_arn" \
        --attributes Key=deletion_protection.enabled,Value=false >/dev/null
    run aws elbv2 delete-load-balancer --load-balancer-arn "$alb_arn"
    wait_real aws elbv2 wait load-balancers-deleted --load-balancer-arns "$alb_arn"
fi
tg_arn=$(q elbv2 describe-target-groups --names "$TG" --query 'TargetGroups[0].TargetGroupArn')
if [[ -n "$tg_arn" ]]; then
    drop "target group $TG"
    if [[ "$DRY_RUN" == "true" ]]; then
        run aws elbv2 delete-target-group --target-group-arn "$tg_arn"
    else
        for _ in $(seq 1 12); do aws elbv2 delete-target-group --target-group-arn "$tg_arn" 2>/dev/null && break; sleep 10; done
    fi
fi
# The two Elastic IPs that sat on the ALB's network interfaces (inventory of 2026-10-30).
ALB_EIPS=(eipalloc-0768ec4a86fd8434d eipalloc-0568f77945f6983d6)
[[ "$DRY_RUN" == "true" ]] || sleep 30
for alloc in "${ALB_EIPS[@]}"; do
    state=$(q ec2 describe-addresses --allocation-ids "$alloc" --query 'Addresses[0].[AllocationId,AssociationId]')
    [[ -n "$state" ]] || continue
    if [[ "$(awk '{print $2}' <<<"$state")" =~ ^(None)?$ || "$DRY_RUN" == "true" ]]; then
        drop "Elastic IP $alloc (was on $ALB)"
        run aws ec2 release-address --allocation-id "$alloc" || warn "could not release $alloc"
    else
        warn "$alloc is still associated — re-run later"
    fi
done

step "CloudFront $CF_ID"
enabled=$(q cloudfront get-distribution-config --id "$CF_ID" --query 'DistributionConfig.Enabled')
if [[ -n "$enabled" ]]; then
    drop "distribution $CF_ID (disable, wait for deploy, delete)"
    if [[ "$enabled" == "True" ]]; then
        f=$(mktemp)
        etag=$(aws cloudfront get-distribution-config --id "$CF_ID" --query ETag --output text)
        aws cloudfront get-distribution-config --id "$CF_ID" --query DistributionConfig --output json | jq '.Enabled = false' >"$f"
        run aws cloudfront update-distribution --id "$CF_ID" --if-match "$etag" --distribution-config "file://$f" >/dev/null
        rm -f "$f"
    fi
    wait_real aws cloudfront wait distribution-deployed --id "$CF_ID"
    etag=$(q cloudfront get-distribution-config --id "$CF_ID" --query ETag)
    run aws cloudfront delete-distribution --id "$CF_ID" --if-match "$etag"
fi

step "Old network pieces"
if [[ -n "$(q rds describe-db-subnet-groups --db-subnet-group-name koboko-db-subnet-group --query 'DBSubnetGroups[0].DBSubnetGroupName')" ]]; then
    drop "DB subnet group koboko-db-subnet-group"
    run aws rds delete-db-subnet-group --db-subnet-group-name koboko-db-subnet-group
fi
sg_ids=()
for name in "${OLD_SGS[@]}"; do
    id=$(q ec2 describe-security-groups --filters Name=group-name,Values="$name" --query 'SecurityGroups[0].GroupId')
    [[ -n "$id" ]] && sg_ids+=("$id")
done
# They reference each other, so clear inbound rules first.
for id in "${sg_ids[@]+"${sg_ids[@]}"}"; do
    perms=$(aws ec2 describe-security-groups --group-ids "$id" --query 'SecurityGroups[0].IpPermissions' --output json)
    [[ "$perms" == "[]" ]] || run aws ec2 revoke-security-group-ingress --group-id "$id" --ip-permissions "$perms" >/dev/null
done
for id in "${sg_ids[@]+"${sg_ids[@]}"}"; do
    drop "security group $id"
    run aws ec2 delete-security-group --group-id "$id" || warn "$id still in use (ENIs can take a few minutes to go) — re-run later"
done

step "Kept, with housekeeping"
change "log group $LOG_GROUP -> 30-day retention"
run aws logs put-retention-policy --log-group-name "$LOG_GROUP" --retention-in-days 30
change "ECR $ECR_REPO -> keep the last 10 images"
run aws ecr put-lifecycle-policy --repository-name "$ECR_REPO" --lifecycle-policy-text \
    '{"rules":[{"rulePriority":1,"description":"keep last 10","selection":{"tagStatus":"any","countType":"imageCountMoreThan","countNumber":10},"action":{"type":"expire"}}]}' >/dev/null

[[ "$DRY_RUN" == "true" ]] && log "   Dry run only — nothing was changed."
exit 0
