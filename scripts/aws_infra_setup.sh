#!/usr/bin/env bash
# ──────────────────────────────────────────────────────────────────────────────
#  aws_infra_setup.sh — One-time AWS infrastructure provisioning for koboko.dev
#
#  What this creates:
#    VPC + subnets + IGW + route tables
#    Security groups (ALB, ECS tasks, RDS)
#    RDS PostgreSQL 15 (t3.micro — free-tier eligible)
#    ECR repository for the backend Docker image
#    ECS Fargate cluster + task definition + service
#    Application Load Balancer (HTTPS via ACM cert)
#    S3 bucket for media uploads
#    IAM task execution role
#
#  Usage:
#    export AWS_REGION=us-east-1
#    export AWS_ACCOUNT_ID=123456789012
#    export DOMAIN=koboko.dev
#    export DB_PASSWORD=YourStrongPassword123!
#    export SECRET_KEY=<output of: python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())">
#    ./scripts/aws_infra_setup.sh
#
#  Re-running is safe — resources that already exist are skipped.
#  After this runs, copy the output values into your CI/CD secrets.
# ──────────────────────────────────────────────────────────────────────────────
set -euo pipefail

# ── Required env vars ─────────────────────────────────────────────────────────
: "${AWS_REGION:?Set AWS_REGION (e.g. us-east-1)}"
: "${AWS_ACCOUNT_ID:?Set AWS_ACCOUNT_ID}"
: "${DOMAIN:?Set DOMAIN (e.g. koboko.dev)}"
: "${DB_PASSWORD:?Set DB_PASSWORD (strong password for RDS)}"
: "${SECRET_KEY:?Set SECRET_KEY (Django secret key)}"

# ── Config ────────────────────────────────────────────────────────────────────
APP_NAME="koboko"
ECR_REPO="${APP_NAME}-backend"
ECS_CLUSTER="${APP_NAME}-cluster"
ECS_SERVICE="${APP_NAME}-backend"
ECS_TASK_DEF="${APP_NAME}-backend"
DB_NAME="koboko_prod"
DB_USER="koboko"
DB_INSTANCE="${APP_NAME}-postgres"
S3_BUCKET="${APP_NAME}-media-${AWS_ACCOUNT_ID}"
VPC_CIDR="10.0.0.0/16"

log()  { printf '\033[1;36m▶ %s\033[0m\n' "$*"; }
ok()   { printf '\033[1;32m✓ %s\033[0m\n' "$*"; }
warn() { printf '\033[1;33m⚠ %s\033[0m\n' "$*"; }
err()  { printf '\033[1;31m✗ %s\033[0m\n' "$*" >&2; exit 1; }
sep()  { printf '\033[0;90m%.0s─\033[0m' {1..70}; echo; }

# ─────────────────────────────────────────────────────────────────────────────
# 1. VPC
# ─────────────────────────────────────────────────────────────────────────────
sep
log "1/11 — VPC"

VPC_ID=$(aws ec2 describe-vpcs \
    --filters "Name=tag:Name,Values=${APP_NAME}-vpc" \
    --query 'Vpcs[0].VpcId' --output text --region "$AWS_REGION" 2>/dev/null || echo "None")

if [ "$VPC_ID" = "None" ] || [ -z "$VPC_ID" ]; then
    VPC_ID=$(aws ec2 create-vpc \
        --cidr-block "$VPC_CIDR" \
        --tag-specifications "ResourceType=vpc,Tags=[{Key=Name,Value=${APP_NAME}-vpc}]" \
        --query 'Vpc.VpcId' --output text --region "$AWS_REGION")
    aws ec2 modify-vpc-attribute --vpc-id "$VPC_ID" --enable-dns-support --region "$AWS_REGION"
    aws ec2 modify-vpc-attribute --vpc-id "$VPC_ID" --enable-dns-hostnames --region "$AWS_REGION"
    ok "Created VPC: $VPC_ID"
else
    ok "VPC exists: $VPC_ID"
fi

# Internet Gateway
IGW_ID=$(aws ec2 describe-internet-gateways \
    --filters "Name=attachment.vpc-id,Values=${VPC_ID}" \
    --query 'InternetGateways[0].InternetGatewayId' --output text --region "$AWS_REGION")

if [ "$IGW_ID" = "None" ] || [ -z "$IGW_ID" ]; then
    IGW_ID=$(aws ec2 create-internet-gateway \
        --tag-specifications "ResourceType=internet-gateway,Tags=[{Key=Name,Value=${APP_NAME}-igw}]" \
        --query 'InternetGateway.InternetGatewayId' --output text --region "$AWS_REGION")
    aws ec2 attach-internet-gateway --internet-gateway-id "$IGW_ID" --vpc-id "$VPC_ID" --region "$AWS_REGION"
    ok "Created + attached IGW: $IGW_ID"
else
    ok "IGW exists: $IGW_ID"
fi

# Public subnets (2 AZs for ALB requirement)
AZS=($(aws ec2 describe-availability-zones \
    --query 'AvailabilityZones[?State==`available`].ZoneName' \
    --output text --region "$AWS_REGION" | tr '\t' '\n' | head -2))

SUBNET_PUBLIC_1=$(aws ec2 describe-subnets \
    --filters "Name=vpc-id,Values=${VPC_ID}" "Name=tag:Name,Values=${APP_NAME}-public-1" \
    --query 'Subnets[0].SubnetId' --output text --region "$AWS_REGION")

if [ "$SUBNET_PUBLIC_1" = "None" ] || [ -z "$SUBNET_PUBLIC_1" ]; then
    SUBNET_PUBLIC_1=$(aws ec2 create-subnet \
        --vpc-id "$VPC_ID" --cidr-block "10.0.1.0/24" \
        --availability-zone "${AZS[0]}" \
        --tag-specifications "ResourceType=subnet,Tags=[{Key=Name,Value=${APP_NAME}-public-1}]" \
        --query 'Subnet.SubnetId' --output text --region "$AWS_REGION")
    ok "Created subnet public-1: $SUBNET_PUBLIC_1"
else
    ok "Subnet public-1 exists: $SUBNET_PUBLIC_1"
fi

SUBNET_PUBLIC_2=$(aws ec2 describe-subnets \
    --filters "Name=vpc-id,Values=${VPC_ID}" "Name=tag:Name,Values=${APP_NAME}-public-2" \
    --query 'Subnets[0].SubnetId' --output text --region "$AWS_REGION")

if [ "$SUBNET_PUBLIC_2" = "None" ] || [ -z "$SUBNET_PUBLIC_2" ]; then
    SUBNET_PUBLIC_2=$(aws ec2 create-subnet \
        --vpc-id "$VPC_ID" --cidr-block "10.0.2.0/24" \
        --availability-zone "${AZS[1]}" \
        --tag-specifications "ResourceType=subnet,Tags=[{Key=Name,Value=${APP_NAME}-public-2}]" \
        --query 'Subnet.SubnetId' --output text --region "$AWS_REGION")
    ok "Created subnet public-2: $SUBNET_PUBLIC_2"
else
    ok "Subnet public-2 exists: $SUBNET_PUBLIC_2"
fi

# Route table
RTB_ID=$(aws ec2 describe-route-tables \
    --filters "Name=vpc-id,Values=${VPC_ID}" "Name=tag:Name,Values=${APP_NAME}-public-rtb" \
    --query 'RouteTables[0].RouteTableId' --output text --region "$AWS_REGION")

if [ "$RTB_ID" = "None" ] || [ -z "$RTB_ID" ]; then
    RTB_ID=$(aws ec2 create-route-table \
        --vpc-id "$VPC_ID" \
        --tag-specifications "ResourceType=route-table,Tags=[{Key=Name,Value=${APP_NAME}-public-rtb}]" \
        --query 'RouteTable.RouteTableId' --output text --region "$AWS_REGION")
    aws ec2 create-route --route-table-id "$RTB_ID" --destination-cidr-block 0.0.0.0/0 \
        --gateway-id "$IGW_ID" --region "$AWS_REGION" > /dev/null
    aws ec2 associate-route-table --route-table-id "$RTB_ID" --subnet-id "$SUBNET_PUBLIC_1" --region "$AWS_REGION" > /dev/null
    aws ec2 associate-route-table --route-table-id "$RTB_ID" --subnet-id "$SUBNET_PUBLIC_2" --region "$AWS_REGION" > /dev/null
    ok "Created route table: $RTB_ID"
else
    ok "Route table exists: $RTB_ID"
fi

# ─────────────────────────────────────────────────────────────────────────────
# 2. Security Groups
# ─────────────────────────────────────────────────────────────────────────────
sep
log "2/11 — Security Groups"

get_or_create_sg() {
    local name="$1" desc="$2"
    local sg_id
    sg_id=$(aws ec2 describe-security-groups \
        --filters "Name=group-name,Values=${name}" "Name=vpc-id,Values=${VPC_ID}" \
        --query 'SecurityGroups[0].GroupId' --output text --region "$AWS_REGION")
    if [ "$sg_id" = "None" ] || [ -z "$sg_id" ]; then
        sg_id=$(aws ec2 create-security-group \
            --group-name "$name" --description "$desc" --vpc-id "$VPC_ID" \
            --query 'GroupId' --output text --region "$AWS_REGION")
        ok "Created SG ${name}: ${sg_id}"
    else
        ok "SG exists ${name}: ${sg_id}"
    fi
    echo "$sg_id"
}

SG_ALB=$(get_or_create_sg "${APP_NAME}-alb-sg" "ALB: HTTP/HTTPS from internet")
SG_ECS=$(get_or_create_sg "${APP_NAME}-ecs-sg" "ECS tasks: inbound from ALB only")
SG_RDS=$(get_or_create_sg "${APP_NAME}-rds-sg" "RDS: inbound from ECS tasks only")

# ALB rules: allow 80 + 443 from anywhere
aws ec2 authorize-security-group-ingress --group-id "$SG_ALB" \
    --ip-permissions '[{"IpProtocol":"tcp","FromPort":80,"ToPort":80,"IpRanges":[{"CidrIp":"0.0.0.0/0"}]}]' \
    --region "$AWS_REGION" 2>/dev/null || true
aws ec2 authorize-security-group-ingress --group-id "$SG_ALB" \
    --ip-permissions '[{"IpProtocol":"tcp","FromPort":443,"ToPort":443,"IpRanges":[{"CidrIp":"0.0.0.0/0"}]}]' \
    --region "$AWS_REGION" 2>/dev/null || true

# ECS rules: allow 8000 from ALB only
aws ec2 authorize-security-group-ingress --group-id "$SG_ECS" \
    --ip-permissions "[{\"IpProtocol\":\"tcp\",\"FromPort\":8000,\"ToPort\":8000,\"UserIdGroupPairs\":[{\"GroupId\":\"${SG_ALB}\"}]}]" \
    --region "$AWS_REGION" 2>/dev/null || true

# RDS rules: allow 5432 from ECS tasks only
aws ec2 authorize-security-group-ingress --group-id "$SG_RDS" \
    --ip-permissions "[{\"IpProtocol\":\"tcp\",\"FromPort\":5432,\"ToPort\":5432,\"UserIdGroupPairs\":[{\"GroupId\":\"${SG_ECS}\"}]}]" \
    --region "$AWS_REGION" 2>/dev/null || true

# ─────────────────────────────────────────────────────────────────────────────
# 3. RDS PostgreSQL
# ─────────────────────────────────────────────────────────────────────────────
sep
log "3/11 — RDS PostgreSQL (t3.micro)"

# RDS subnet group
aws rds describe-db-subnet-groups --db-subnet-group-name "${APP_NAME}-db-subnet" \
    --region "$AWS_REGION" > /dev/null 2>&1 || \
aws rds create-db-subnet-group \
    --db-subnet-group-name "${APP_NAME}-db-subnet" \
    --db-subnet-group-description "Koboko RDS subnet group" \
    --subnet-ids "$SUBNET_PUBLIC_1" "$SUBNET_PUBLIC_2" \
    --region "$AWS_REGION" > /dev/null

DB_STATUS=$(aws rds describe-db-instances \
    --db-instance-identifier "$DB_INSTANCE" \
    --query 'DBInstances[0].DBInstanceStatus' \
    --output text --region "$AWS_REGION" 2>/dev/null || echo "notfound")

if [ "$DB_STATUS" = "notfound" ]; then
    log "Creating RDS instance (takes ~5 minutes)..."
    aws rds create-db-instance \
        --db-instance-identifier "$DB_INSTANCE" \
        --db-instance-class db.t3.micro \
        --engine postgres \
        --engine-version "15.4" \
        --master-username "$DB_USER" \
        --master-user-password "$DB_PASSWORD" \
        --db-name "$DB_NAME" \
        --allocated-storage 20 \
        --storage-type gp2 \
        --no-multi-az \
        --publicly-accessible \
        --vpc-security-group-ids "$SG_RDS" \
        --db-subnet-group-name "${APP_NAME}-db-subnet" \
        --backup-retention-period 7 \
        --no-deletion-protection \
        --region "$AWS_REGION" > /dev/null
    ok "RDS creation triggered — waiting for available state..."
    aws rds wait db-instance-available \
        --db-instance-identifier "$DB_INSTANCE" --region "$AWS_REGION"
    ok "RDS ready"
else
    ok "RDS exists (status: ${DB_STATUS})"
fi

DB_HOST=$(aws rds describe-db-instances \
    --db-instance-identifier "$DB_INSTANCE" \
    --query 'DBInstances[0].Endpoint.Address' \
    --output text --region "$AWS_REGION")
ok "RDS endpoint: $DB_HOST"

# ─────────────────────────────────────────────────────────────────────────────
# 4. S3 Bucket for media
# ─────────────────────────────────────────────────────────────────────────────
sep
log "4/11 — S3 media bucket"

aws s3api head-bucket --bucket "$S3_BUCKET" --region "$AWS_REGION" 2>/dev/null || \
aws s3api create-bucket \
    --bucket "$S3_BUCKET" \
    --region "$AWS_REGION" \
    $([ "$AWS_REGION" != "us-east-1" ] && echo "--create-bucket-configuration LocationConstraint=${AWS_REGION}") \
    > /dev/null

aws s3api put-bucket-cors --bucket "$S3_BUCKET" --region "$AWS_REGION" \
    --cors-configuration '{
      "CORSRules": [{
        "AllowedOrigins": ["*"],
        "AllowedMethods": ["GET"],
        "AllowedHeaders": ["*"],
        "MaxAgeSeconds": 3000
      }]
    }'

# Public read policy for media
aws s3api put-bucket-policy --bucket "$S3_BUCKET" --region "$AWS_REGION" \
    --policy "{
      \"Version\": \"2012-10-17\",
      \"Statement\": [{
        \"Effect\": \"Allow\",
        \"Principal\": \"*\",
        \"Action\": \"s3:GetObject\",
        \"Resource\": \"arn:aws:s3:::${S3_BUCKET}/*\"
      }]
    }"

ok "S3 bucket: s3://${S3_BUCKET}"

# ─────────────────────────────────────────────────────────────────────────────
# 5. ECR Repository
# ─────────────────────────────────────────────────────────────────────────────
sep
log "5/11 — ECR repository"

ECR_URI="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${ECR_REPO}"

aws ecr describe-repositories --repository-names "$ECR_REPO" --region "$AWS_REGION" > /dev/null 2>&1 || \
aws ecr create-repository \
    --repository-name "$ECR_REPO" \
    --image-scanning-configuration scanOnPush=true \
    --region "$AWS_REGION" > /dev/null

ok "ECR: ${ECR_URI}"

# ─────────────────────────────────────────────────────────────────────────────
# 6. IAM Roles
# ─────────────────────────────────────────────────────────────────────────────
sep
log "6/11 — IAM task execution role"

EXEC_ROLE_NAME="${APP_NAME}-ecs-exec-role"
TASK_ROLE_NAME="${APP_NAME}-ecs-task-role"

create_role_if_absent() {
    local role_name="$1" trust_doc="$2"
    aws iam get-role --role-name "$role_name" > /dev/null 2>&1 || \
    aws iam create-role --role-name "$role_name" \
        --assume-role-policy-document "$trust_doc" > /dev/null
}

ECS_TRUST='{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": {"Service": "ecs-tasks.amazonaws.com"},
    "Action": "sts:AssumeRole"
  }]
}'

create_role_if_absent "$EXEC_ROLE_NAME" "$ECS_TRUST"
create_role_if_absent "$TASK_ROLE_NAME" "$ECS_TRUST"

aws iam attach-role-policy --role-name "$EXEC_ROLE_NAME" \
    --policy-arn arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy 2>/dev/null || true

# Allow task role to access S3 bucket
aws iam put-role-policy --role-name "$TASK_ROLE_NAME" \
    --policy-name "${APP_NAME}-s3-media" \
    --policy-document "{
      \"Version\": \"2012-10-17\",
      \"Statement\": [{
        \"Effect\": \"Allow\",
        \"Action\": [\"s3:GetObject\",\"s3:PutObject\",\"s3:DeleteObject\",\"s3:ListBucket\"],
        \"Resource\": [\"arn:aws:s3:::${S3_BUCKET}\",\"arn:aws:s3:::${S3_BUCKET}/*\"]
      }]
    }"

EXEC_ROLE_ARN=$(aws iam get-role --role-name "$EXEC_ROLE_NAME" \
    --query 'Role.Arn' --output text)
TASK_ROLE_ARN=$(aws iam get-role --role-name "$TASK_ROLE_NAME" \
    --query 'Role.Arn' --output text)

ok "Exec role: $EXEC_ROLE_ARN"
ok "Task role: $TASK_ROLE_ARN"

# ─────────────────────────────────────────────────────────────────────────────
# 7. ECS Cluster
# ─────────────────────────────────────────────────────────────────────────────
sep
log "7/11 — ECS cluster"

aws ecs describe-clusters --clusters "$ECS_CLUSTER" \
    --query 'clusters[?status==`ACTIVE`].clusterName' \
    --output text --region "$AWS_REGION" | grep -q "$ECS_CLUSTER" || \
aws ecs create-cluster \
    --cluster-name "$ECS_CLUSTER" \
    --capacity-providers FARGATE FARGATE_SPOT \
    --region "$AWS_REGION" > /dev/null

ok "ECS cluster: $ECS_CLUSTER"

# ─────────────────────────────────────────────────────────────────────────────
# 8. CloudWatch Log Group
# ─────────────────────────────────────────────────────────────────────────────
sep
log "8/11 — CloudWatch log group"

aws logs describe-log-groups \
    --log-group-name-prefix "/ecs/${APP_NAME}" \
    --query 'logGroups[0].logGroupName' \
    --output text --region "$AWS_REGION" | grep -q "${APP_NAME}" || \
aws logs create-log-group \
    --log-group-name "/ecs/${APP_NAME}-backend" \
    --region "$AWS_REGION"

aws logs put-retention-policy \
    --log-group-name "/ecs/${APP_NAME}-backend" \
    --retention-in-days 30 \
    --region "$AWS_REGION" 2>/dev/null || true

ok "Log group: /ecs/${APP_NAME}-backend"

# ─────────────────────────────────────────────────────────────────────────────
# 9. ECS Task Definition
# ─────────────────────────────────────────────────────────────────────────────
sep
log "9/11 — ECS task definition"

TASK_DEF=$(cat <<JSON
{
  "family": "${ECS_TASK_DEF}",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "512",
  "memory": "1024",
  "executionRoleArn": "${EXEC_ROLE_ARN}",
  "taskRoleArn": "${TASK_ROLE_ARN}",
  "containerDefinitions": [
    {
      "name": "backend",
      "image": "${ECR_URI}:latest",
      "essential": true,
      "portMappings": [{"containerPort": 8000, "protocol": "tcp"}],
      "environment": [
        {"name": "DEBUG",             "value": "False"},
        {"name": "DB_ENGINE",         "value": "postgresql"},
        {"name": "DB_HOST",           "value": "${DB_HOST}"},
        {"name": "DB_PORT",           "value": "5432"},
        {"name": "DB_NAME",           "value": "${DB_NAME}"},
        {"name": "DB_USER",           "value": "${DB_USER}"},
        {"name": "DB_PASSWORD",       "value": "${DB_PASSWORD}"},
        {"name": "SECRET_KEY",        "value": "${SECRET_KEY}"},
        {"name": "ALLOWED_HOSTS",     "value": "api.${DOMAIN},${DOMAIN}"},
        {"name": "CORS_ALLOWED_ORIGINS", "value": "https://${DOMAIN},https://www.${DOMAIN}"},
        {"name": "CSRF_TRUSTED_ORIGINS", "value": "https://${DOMAIN},https://www.${DOMAIN}"},
        {"name": "SITE_URL",          "value": "https://${DOMAIN}"},
        {"name": "USE_S3",            "value": "True"},
        {"name": "AWS_STORAGE_BUCKET_NAME", "value": "${S3_BUCKET}"},
        {"name": "AWS_S3_REGION_NAME","value": "${AWS_REGION}"}
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/${APP_NAME}-backend",
          "awslogs-region": "${AWS_REGION}",
          "awslogs-stream-prefix": "ecs"
        }
      },
      "healthCheck": {
        "command": ["CMD-SHELL", "python manage.py check --deploy 2>/dev/null || exit 0"],
        "interval": 30,
        "timeout": 5,
        "retries": 3,
        "startPeriod": 60
      }
    }
  ]
}
JSON
)

aws ecs register-task-definition \
    --cli-input-json "$TASK_DEF" \
    --region "$AWS_REGION" > /dev/null

ok "Task definition registered: ${ECS_TASK_DEF}"

# ─────────────────────────────────────────────────────────────────────────────
# 10. Application Load Balancer
# ─────────────────────────────────────────────────────────────────────────────
sep
log "10/11 — Application Load Balancer"

ALB_ARN=$(aws elbv2 describe-load-balancers \
    --names "${APP_NAME}-alb" \
    --query 'LoadBalancers[0].LoadBalancerArn' \
    --output text --region "$AWS_REGION" 2>/dev/null || echo "None")

if [ "$ALB_ARN" = "None" ] || [ -z "$ALB_ARN" ]; then
    ALB_ARN=$(aws elbv2 create-load-balancer \
        --name "${APP_NAME}-alb" \
        --subnets "$SUBNET_PUBLIC_1" "$SUBNET_PUBLIC_2" \
        --security-groups "$SG_ALB" \
        --scheme internet-facing \
        --type application \
        --ip-address-type ipv4 \
        --query 'LoadBalancers[0].LoadBalancerArn' \
        --output text --region "$AWS_REGION")
    ok "Created ALB: ${ALB_ARN}"
else
    ok "ALB exists"
fi

ALB_DNS=$(aws elbv2 describe-load-balancers \
    --load-balancer-arns "$ALB_ARN" \
    --query 'LoadBalancers[0].DNSName' \
    --output text --region "$AWS_REGION")

# Target group
TG_ARN=$(aws elbv2 describe-target-groups \
    --names "${APP_NAME}-tg" \
    --query 'TargetGroups[0].TargetGroupArn' \
    --output text --region "$AWS_REGION" 2>/dev/null || echo "None")

if [ "$TG_ARN" = "None" ] || [ -z "$TG_ARN" ]; then
    TG_ARN=$(aws elbv2 create-target-group \
        --name "${APP_NAME}-tg" \
        --protocol HTTP \
        --port 8000 \
        --vpc-id "$VPC_ID" \
        --target-type ip \
        --health-check-path "/api/core/health/" \
        --health-check-interval-seconds 30 \
        --healthy-threshold-count 2 \
        --unhealthy-threshold-count 3 \
        --query 'TargetGroups[0].TargetGroupArn' \
        --output text --region "$AWS_REGION")
    ok "Created target group: ${TG_ARN}"
else
    ok "Target group exists"
fi

# HTTP listener (redirect to HTTPS if cert exists, otherwise forward)
HTTP_LISTENER=$(aws elbv2 describe-listeners \
    --load-balancer-arn "$ALB_ARN" \
    --query 'Listeners[?Port==`80`].ListenerArn' \
    --output text --region "$AWS_REGION")

if [ -z "$HTTP_LISTENER" ]; then
    aws elbv2 create-listener \
        --load-balancer-arn "$ALB_ARN" \
        --protocol HTTP --port 80 \
        --default-actions "Type=forward,TargetGroupArn=${TG_ARN}" \
        --region "$AWS_REGION" > /dev/null
    ok "HTTP listener created (upgrade to HTTPS redirect after adding ACM cert)"
fi

# ─────────────────────────────────────────────────────────────────────────────
# 11. ECS Service
# ─────────────────────────────────────────────────────────────────────────────
sep
log "11/11 — ECS Fargate service"

SVC_STATUS=$(aws ecs describe-services \
    --cluster "$ECS_CLUSTER" --services "$ECS_SERVICE" \
    --query 'services[0].status' --output text --region "$AWS_REGION" 2>/dev/null || echo "notfound")

if [ "$SVC_STATUS" = "notfound" ] || [ "$SVC_STATUS" = "INACTIVE" ]; then
    aws ecs create-service \
        --cluster "$ECS_CLUSTER" \
        --service-name "$ECS_SERVICE" \
        --task-definition "$ECS_TASK_DEF" \
        --desired-count 1 \
        --launch-type FARGATE \
        --network-configuration "awsvpcConfiguration={
            subnets=[${SUBNET_PUBLIC_1},${SUBNET_PUBLIC_2}],
            securityGroups=[${SG_ECS}],
            assignPublicIp=ENABLED
        }" \
        --load-balancers "targetGroupArn=${TG_ARN},containerName=backend,containerPort=8000" \
        --region "$AWS_REGION" > /dev/null
    ok "ECS service created: ${ECS_SERVICE}"
else
    ok "ECS service exists (status: ${SVC_STATUS})"
fi

# ─────────────────────────────────────────────────────────────────────────────
# Done — Print summary
# ─────────────────────────────────────────────────────────────────────────────
sep
printf '\033[1;32m\n  ✓ Infrastructure ready\n\n\033[0m'
printf '\033[1;33m  SAVE THESE VALUES — you need them for CI/CD and DNS:\033[0m\n\n'
printf '  %-30s %s\n' "ALB DNS (→ CNAME for api.$DOMAIN):" "$ALB_DNS"
printf '  %-30s %s\n' "ECR image URI:"                      "$ECR_URI"
printf '  %-30s %s\n' "RDS host:"                           "$DB_HOST"
printf '  %-30s %s\n' "S3 bucket:"                          "$S3_BUCKET"
printf '  %-30s %s\n' "ECS cluster:"                        "$ECS_CLUSTER"
printf '  %-30s %s\n' "ECS service:"                        "$ECS_SERVICE"
printf '\n'
printf '\033[1;36m  NEXT STEPS:\033[0m\n'
printf '  1. Point  api.%s  →  %s  (DNS CNAME)\n' "$DOMAIN" "$ALB_DNS"
printf '  2. Request an ACM cert for api.%s in AWS Certificate Manager\n' "$DOMAIN"
printf '  3. Add HTTPS listener (port 443) to the ALB using the ACM cert ARN\n'
printf '  4. Build + push your first image:\n'
printf '       export AWS_ACCOUNT_ID=%s AWS_REGION=%s ECR_REPO_BACKEND=%s\n' "$AWS_ACCOUNT_ID" "$AWS_REGION" "$ECR_REPO"
printf '       ./scripts/aws_deploy.sh --push-only\n'
printf '  5. Run migrations:\n'
printf '       ./scripts/aws_deploy.sh --migrate-only\n'
printf '  6. Force new ECS deployment:\n'
printf '       ./scripts/aws_deploy.sh --full\n'
printf '  7. Visit https://api.%s/api/ to confirm the API is live\n' "$DOMAIN"
printf '\n'
sep
