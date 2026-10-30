#!/usr/bin/env bash
# Single-host AWS setup for the portfolio backend (~USD 12/month):
#   * EC2 t4g.micro, Ubuntu 24.04 arm64, IMDSv2, standard CPU credits,
#     termination protection, Elastic IP. Runs nginx + certbot, the
#     koboko-backend container, and PostgreSQL 16 locally (see infra/host/setup.sh).
#   * Security group: 80/443 from anywhere, 22 from SSH_CIDR only.
#   * Private S3 bucket for nightly pg_dump backups (expire after 30 days).
#   * IAM instance role: same S3 and SES access the old ECS task role had,
#     plus ECR pull, read of the koboko/backend secret, put-only backups, SSM.
#
#   bash infra/aws/provision.sh                  # dry run
#   DRY_RUN=false bash infra/aws/provision.sh    # apply

source "$(dirname "$0")/lib.sh"
require_identity

INSTANCE_TYPE="${INSTANCE_TYPE:-t4g.micro}"
ROOT_VOLUME_GB="${ROOT_VOLUME_GB:-16}"
BACKUP_RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-30}"
SSH_PUBLIC_KEY_FILE="${SSH_PUBLIC_KEY_FILE:-$HOME/.ssh/id_ed25519.pub}"
SSH_CIDR="${SSH_CIDR:-$(curl -fsS https://checkip.amazonaws.com | tr -d '[:space:]')/32}"
ROLE_NAME="$PREFIX-host"
SG_NAME="$PREFIX-host-sg"

step "Network (default VPC)"
VPC_ID=$(q ec2 describe-vpcs --filters Name=isDefault,Values=true --query 'Vpcs[0].VpcId')
[[ -n "$VPC_ID" ]] || { log "No default VPC in $AWS_REGION."; exit 1; }
SUBNET_ID="${SUBNET_ID:-$(q ec2 describe-subnets --filters Name=vpc-id,Values="$VPC_ID" Name=default-for-az,Values=true \
    --query 'sort_by(Subnets,&AvailabilityZone)[0].SubnetId')}"
have "VPC $VPC_ID, subnet $SUBNET_ID"

step "Security group $SG_NAME"
SG_ID=$(q ec2 describe-security-groups --filters Name=vpc-id,Values="$VPC_ID" Name=group-name,Values="$SG_NAME" \
    --query 'SecurityGroups[0].GroupId')
if [[ -n "$SG_ID" ]]; then
    have "$SG_NAME ($SG_ID)"
else
    plan "$SG_NAME"
    if [[ "$DRY_RUN" == "true" ]]; then
        run aws ec2 create-security-group --group-name "$SG_NAME" --vpc-id "$VPC_ID" --description "..."
        SG_ID="<$SG_NAME>"
    else
        SG_ID=$(aws ec2 create-security-group --group-name "$SG_NAME" --vpc-id "$VPC_ID" \
            --description "Portfolio host: HTTP/HTTPS public, SSH restricted" \
            --tag-specifications "$(ec2_tag_spec security-group "$SG_NAME")" --query GroupId --output text)
    fi
fi
ingress() { # <port> <cidr> <label>
    local key=IpRanges field=CidrIp found=""
    [[ "$2" == *:* ]] && key=Ipv6Ranges field=CidrIpv6
    [[ "$SG_ID" == "<"* ]] || found=$(q ec2 describe-security-groups --group-ids "$SG_ID" \
        --query "SecurityGroups[0].IpPermissions[?FromPort==\`$1\`].$key[?$field=='$2'].$field")
    if [[ -n "$found" ]]; then have "  $3"; return; fi
    plan "  $3"
    run aws ec2 authorize-security-group-ingress --group-id "$SG_ID" \
        --ip-permissions "IpProtocol=tcp,FromPort=$1,ToPort=$1,$key=[{$field=$2,Description=\"$3\"}]" >/dev/null
}
ingress 80 0.0.0.0/0 "HTTP from anywhere (IPv4)"
ingress 80 ::/0 "HTTP from anywhere (IPv6)"
ingress 443 0.0.0.0/0 "HTTPS from anywhere (IPv4)"
ingress 443 ::/0 "HTTPS from anywhere (IPv6)"
ingress 22 "$SSH_CIDR" "SSH from operator IP $SSH_CIDR"

step "Backup bucket $BACKUP_BUCKET"
if aws s3api head-bucket --bucket "$BACKUP_BUCKET" >/dev/null 2>&1; then
    have "bucket $BACKUP_BUCKET"
else
    plan "private bucket $BACKUP_BUCKET, dumps expire after $BACKUP_RETENTION_DAYS days"
    run aws s3api create-bucket --bucket "$BACKUP_BUCKET" --create-bucket-configuration LocationConstraint="$AWS_REGION" >/dev/null
fi
run aws s3api put-public-access-block --bucket "$BACKUP_BUCKET" --public-access-block-configuration \
    BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true
run aws s3api put-bucket-tagging --bucket "$BACKUP_BUCKET" --tagging "$TAGS_S3"
run aws s3api put-bucket-policy --bucket "$BACKUP_BUCKET" --policy "{\"Version\":\"2012-10-17\",\"Statement\":[{
  \"Sid\":\"DenyInsecureTransport\",\"Effect\":\"Deny\",\"Principal\":\"*\",\"Action\":\"s3:*\",
  \"Resource\":[\"arn:aws:s3:::$BACKUP_BUCKET\",\"arn:aws:s3:::$BACKUP_BUCKET/*\"],
  \"Condition\":{\"Bool\":{\"aws:SecureTransport\":\"false\"}}}]}"
run aws s3api put-bucket-lifecycle-configuration --bucket "$BACKUP_BUCKET" --lifecycle-configuration \
    "{\"Rules\":[{\"ID\":\"expire-old-backups\",\"Status\":\"Enabled\",\"Filter\":{\"Prefix\":\"pg/\"},
      \"Expiration\":{\"Days\":$BACKUP_RETENTION_DAYS},\"AbortIncompleteMultipartUpload\":{\"DaysAfterInitiation\":1}}]}"

step "IAM instance role $ROLE_NAME"
if [[ -n "$(q iam get-role --role-name "$ROLE_NAME" --query Role.Arn)" ]]; then
    have "role $ROLE_NAME"
else
    plan "role $ROLE_NAME (EC2 trust)"
    run aws iam create-role --role-name "$ROLE_NAME" --tags "${TAGS_KV[@]}" \
        --assume-role-policy-document '{"Version":"2012-10-17","Statement":[{"Effect":"Allow","Principal":{"Service":"ec2.amazonaws.com"},"Action":"sts:AssumeRole"}]}' >/dev/null
fi
change "inline policy: media bucket rw, SES newsletter, ECR pull, read $SECRET_ID, put-only backups"
run aws iam put-role-policy --role-name "$ROLE_NAME" --policy-name host-access --policy-document "{
 \"Version\":\"2012-10-17\",\"Statement\":[
  {\"Effect\":\"Allow\",\"Action\":[\"s3:PutObject\",\"s3:GetObject\",\"s3:DeleteObject\",\"s3:ListBucket\"],
   \"Resource\":[\"arn:aws:s3:::$MEDIA_BUCKET\",\"arn:aws:s3:::$MEDIA_BUCKET/*\"]},
  {\"Effect\":\"Allow\",\"Action\":[\"ses:SendRawEmail\",\"ses:SendEmail\"],\"Resource\":\"*\",
   \"Condition\":{\"StringEquals\":{\"ses:FromAddress\":\"newsletter@koboko.co.ke\"}}},
  {\"Effect\":\"Allow\",\"Action\":\"ecr:GetAuthorizationToken\",\"Resource\":\"*\"},
  {\"Effect\":\"Allow\",\"Action\":[\"ecr:BatchGetImage\",\"ecr:GetDownloadUrlForLayer\",\"ecr:BatchCheckLayerAvailability\"],
   \"Resource\":\"arn:aws:ecr:$AWS_REGION:$ACCOUNT_ID:repository/$ECR_REPO\"},
  {\"Effect\":\"Allow\",\"Action\":\"secretsmanager:GetSecretValue\",
   \"Resource\":\"arn:aws:secretsmanager:$AWS_REGION:$ACCOUNT_ID:secret:$SECRET_ID-*\"},
  {\"Effect\":\"Allow\",\"Action\":[\"s3:PutObject\",\"s3:AbortMultipartUpload\"],
   \"Resource\":\"arn:aws:s3:::$BACKUP_BUCKET/pg/*\"}]}"
if q iam list-attached-role-policies --role-name "$ROLE_NAME" --query 'AttachedPolicies[].PolicyName' | grep -qw AmazonSSMManagedInstanceCore; then
    have "managed policy AmazonSSMManagedInstanceCore"
else
    plan "attach AmazonSSMManagedInstanceCore (lets infra/aws/run_on_host.sh work without SSH)"
    run aws iam attach-role-policy --role-name "$ROLE_NAME" --policy-arn arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore
fi
if [[ -n "$(q iam get-instance-profile --instance-profile-name "$ROLE_NAME" --query InstanceProfile.Arn)" ]]; then
    have "instance profile $ROLE_NAME"
else
    plan "instance profile $ROLE_NAME"
    run aws iam create-instance-profile --instance-profile-name "$ROLE_NAME" --tags "${TAGS_KV[@]}" >/dev/null
    run aws iam add-role-to-instance-profile --instance-profile-name "$ROLE_NAME" --role-name "$ROLE_NAME"
    [[ "$DRY_RUN" == "true" ]] || { log "   waiting 15s for IAM to propagate"; sleep 15; }
fi

step "SSH key pair $PREFIX"
if [[ -n "$(q ec2 describe-key-pairs --key-names "$PREFIX" --query 'KeyPairs[0].KeyName')" ]]; then
    have "key pair $PREFIX"
else
    [[ -f "$SSH_PUBLIC_KEY_FILE" ]] || { log "SSH public key not found: $SSH_PUBLIC_KEY_FILE"; exit 1; }
    plan "import key pair $PREFIX from $SSH_PUBLIC_KEY_FILE"
    run aws ec2 import-key-pair --key-name "$PREFIX" --public-key-material "fileb://$SSH_PUBLIC_KEY_FILE" \
        --tag-specifications "$(ec2_tag_spec key-pair "$PREFIX")" >/dev/null
fi

step "EC2 $INSTANCE_TYPE ($HOST_NAME_TAG)"
INSTANCE_ID=$(host_instance_id)
if [[ -n "$INSTANCE_ID" ]]; then
    have "instance $INSTANCE_ID"
else
    AMI_ID=$(q ssm get-parameter --name /aws/service/canonical/ubuntu/server/24.04/stable/current/arm64/hvm/ebs-gp3/ami-id \
        --query Parameter.Value)
    plan "instance $INSTANCE_TYPE, Ubuntu 24.04 arm64 ($AMI_ID), ${ROOT_VOLUME_GB} GiB gp3 encrypted, IMDSv2,"
    plan "  standard CPU credits, termination protection on"
    if [[ "$DRY_RUN" == "true" ]]; then
        run aws ec2 run-instances --image-id "$AMI_ID" --instance-type "$INSTANCE_TYPE" "..."
        INSTANCE_ID="<new-instance>"
    else
        INSTANCE_ID=$(aws ec2 run-instances \
            --image-id "$AMI_ID" --instance-type "$INSTANCE_TYPE" --key-name "$PREFIX" \
            --subnet-id "$SUBNET_ID" --security-group-ids "$SG_ID" \
            --iam-instance-profile Name="$ROLE_NAME" \
            --credit-specification CpuCredits=standard \
            --metadata-options HttpTokens=required,HttpEndpoint=enabled,HttpPutResponseHopLimit=2 \
            --block-device-mappings "DeviceName=/dev/sda1,Ebs={VolumeSize=$ROOT_VOLUME_GB,VolumeType=gp3,Encrypted=true,DeleteOnTermination=true}" \
            --disable-api-termination \
            --tag-specifications "$(ec2_tag_spec instance "$HOST_NAME_TAG")" "$(ec2_tag_spec volume "$HOST_NAME_TAG-root")" \
            --query 'Instances[0].InstanceId' --output text)
        log "   launched $INSTANCE_ID, waiting for it to run"
        aws ec2 wait instance-running --instance-ids "$INSTANCE_ID"
    fi
fi

step "Elastic IP"
EIP_ALLOC=$(q ec2 describe-addresses --filters Name=tag:Name,Values="$HOST_NAME_TAG" --query 'Addresses[0].AllocationId')
if [[ -n "$EIP_ALLOC" ]]; then
    have "Elastic IP $(q ec2 describe-addresses --allocation-ids "$EIP_ALLOC" --query 'Addresses[0].PublicIp')"
else
    plan "Elastic IP"
    if [[ "$DRY_RUN" == "true" ]]; then
        run aws ec2 allocate-address --domain vpc
        EIP_ALLOC="<new-eip>"
    else
        EIP_ALLOC=$(aws ec2 allocate-address --domain vpc \
            --tag-specifications "$(ec2_tag_spec elastic-ip "$HOST_NAME_TAG")" --query AllocationId --output text)
    fi
fi
if [[ -n "$(q ec2 describe-addresses --filters Name=tag:Name,Values="$HOST_NAME_TAG" Name=instance-id,Values="$INSTANCE_ID" \
    --query 'Addresses[0].AllocationId')" ]]; then
    have "Elastic IP attached to $INSTANCE_ID"
else
    plan "attach Elastic IP to $INSTANCE_ID"
    run aws ec2 associate-address --allocation-id "$EIP_ALLOC" --instance-id "$INSTANCE_ID" >/dev/null
fi
PUBLIC_IP=$(q ec2 describe-addresses --filters Name=tag:Name,Values="$HOST_NAME_TAG" --query 'Addresses[0].PublicIp')

step "Estimated monthly cost (eu-west-1 on-demand, USD)"
cost_line() { printf '   %-42s %7s\n' "$1" "$2" >&2; }
cost_line "EC2 $INSTANCE_TYPE (730 h)" "~6.70"
cost_line "EBS gp3 ${ROOT_VOLUME_GB} GiB" "~1.40"
cost_line "Public IPv4 (Elastic IP, attached)" "~3.65"
cost_line "S3 backups (a few MB, 30-day expiry)" "~0.05"
cost_line "------------------------------------------" "-------"
cost_line "Total" "~11.80"

step "Summary"
log "   Instance: $INSTANCE_ID   Elastic IP: ${PUBLIC_IP:-<pending>}"
log "   Next: bash infra/aws/run_on_host.sh infra/host/setup.sh   (see infra/README.md)"
[[ "$DRY_RUN" == "true" ]] && log "   Dry run only — nothing was changed. Re-run with DRY_RUN=false to apply."
exit 0
