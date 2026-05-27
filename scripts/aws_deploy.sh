#!/usr/bin/env bash
# ──────────────────────────────────────────────────────────────────────────────
#  AWS deployment script for koboko.dev
#
#  Usage:
#    ./scripts/aws_deploy.sh [--push-only | --migrate-only | --full]
#
#  Prerequisites:
#    - AWS CLI configured: aws configure
#    - Docker running
#    - .env set: AWS_ACCOUNT_ID, AWS_REGION, ECR_REPO_BACKEND, ECR_REPO_FRONTEND
# ──────────────────────────────────────────────────────────────────────────────

set -euo pipefail

# ── Config ────────────────────────────────────────────────────────────────────
AWS_REGION="${AWS_REGION:-us-east-1}"
AWS_ACCOUNT_ID="${AWS_ACCOUNT_ID:?Set AWS_ACCOUNT_ID}"
ECR_BASE="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"
REPO_BACKEND="${ECR_REPO_BACKEND:-koboko-backend}"
REPO_FRONTEND="${ECR_REPO_FRONTEND:-koboko-frontend}"
IMAGE_TAG="${IMAGE_TAG:-$(git rev-parse --short HEAD)}"

MODE="${1:---full}"

log() { printf '\033[1;36m%s\033[0m\n' "$*"; }
ok()  { printf '\033[1;32m✓ %s\033[0m\n' "$*"; }
err() { printf '\033[1;31m✗ %s\033[0m\n' "$*" >&2; exit 1; }

# ── ECR login ─────────────────────────────────────────────────────────────────
ecr_login() {
    log "Logging in to ECR..."
    aws ecr get-login-password --region "$AWS_REGION" \
      | docker login --username AWS --password-stdin "$ECR_BASE"
    ok "ECR login successful"
}

# ── Build & push images ───────────────────────────────────────────────────────
push_images() {
    log "Building backend image..."
    docker build \
        -t "${ECR_BASE}/${REPO_BACKEND}:${IMAGE_TAG}" \
        -t "${ECR_BASE}/${REPO_BACKEND}:latest" \
        -f backend/Dockerfile \
        backend/
    ok "Backend image built"

    log "Building frontend image..."
    docker build \
        --build-arg VITE_API_BASE_URL="${VITE_API_BASE_URL:-/api}" \
        --build-arg VITE_SITE_URL="${VITE_SITE_URL:-https://koboko.dev}" \
        -t "${ECR_BASE}/${REPO_FRONTEND}:${IMAGE_TAG}" \
        -t "${ECR_BASE}/${REPO_FRONTEND}:latest" \
        .
    ok "Frontend image built"

    log "Pushing images to ECR..."
    docker push "${ECR_BASE}/${REPO_BACKEND}:${IMAGE_TAG}"
    docker push "${ECR_BASE}/${REPO_BACKEND}:latest"
    docker push "${ECR_BASE}/${REPO_FRONTEND}:${IMAGE_TAG}"
    docker push "${ECR_BASE}/${REPO_FRONTEND}:latest"
    ok "Images pushed: ${IMAGE_TAG}"
}

# ── Run Django migrations on ECS (one-off task) ───────────────────────────────
run_migrations() {
    ECS_CLUSTER="${ECS_CLUSTER:-koboko-cluster}"
    ECS_TASK_DEF="${ECS_TASK_DEF:-koboko-backend-migrate}"

    log "Running Django migrations on ECS..."
    TASK_ARN=$(aws ecs run-task \
        --cluster "$ECS_CLUSTER" \
        --task-definition "$ECS_TASK_DEF" \
        --launch-type FARGATE \
        --network-configuration "awsvpcConfiguration={subnets=[${SUBNET_ID}],securityGroups=[${SG_ID}],assignPublicIp=ENABLED}" \
        --overrides '{"containerOverrides":[{"name":"backend","command":["python","manage.py","migrate","--noinput"]}]}' \
        --query 'tasks[0].taskArn' \
        --output text)

    log "Waiting for migration task to complete..."
    aws ecs wait tasks-stopped --cluster "$ECS_CLUSTER" --tasks "$TASK_ARN"
    EXIT_CODE=$(aws ecs describe-tasks --cluster "$ECS_CLUSTER" --tasks "$TASK_ARN" \
        --query 'tasks[0].containers[0].exitCode' --output text)

    [ "$EXIT_CODE" = "0" ] && ok "Migrations applied" || err "Migration failed (exit $EXIT_CODE)"
}

# ── Update ECS services ───────────────────────────────────────────────────────
deploy_services() {
    ECS_CLUSTER="${ECS_CLUSTER:-koboko-cluster}"

    log "Forcing new deployment of backend service..."
    aws ecs update-service \
        --cluster "$ECS_CLUSTER" \
        --service koboko-backend \
        --force-new-deployment \
        --query 'service.serviceName' \
        --output text

    log "Forcing new deployment of frontend service..."
    aws ecs update-service \
        --cluster "$ECS_CLUSTER" \
        --service koboko-frontend \
        --force-new-deployment \
        --query 'service.serviceName' \
        --output text

    ok "Deployment triggered — services will roll out new tasks"
    log "Monitor: https://console.aws.amazon.com/ecs/home?region=${AWS_REGION}#/clusters/${ECS_CLUSTER}/services"
}

# ── Entry ─────────────────────────────────────────────────────────────────────
case "$MODE" in
    --push-only)    ecr_login; push_images ;;
    --migrate-only) run_migrations ;;
    --full)         ecr_login; push_images; run_migrations; deploy_services ;;
    *)              err "Unknown mode: $MODE. Use --push-only, --migrate-only, or --full" ;;
esac

ok "Deploy complete (${IMAGE_TAG})"
