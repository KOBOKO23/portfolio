#!/usr/bin/env bash
# Shared helpers for infra/aws/*.sh — source this, don't run it.
#
# Every script defaults to DRY_RUN=true: read-only AWS calls still run so the
# plan reflects what already exists, but anything that creates, changes or
# deletes a resource is printed instead of executed. Set DRY_RUN=false to apply.
# Secrets are never passed on the command line or printed.

set -euo pipefail

export AWS_PROFILE="${AWS_PROFILE:-nyumbascout}" # IAM user profile for account 303665698943
export AWS_REGION="${AWS_REGION:-eu-west-1}"
export AWS_DEFAULT_REGION="$AWS_REGION"
export AWS_PAGER=""

DRY_RUN="${DRY_RUN:-true}"
PREFIX="${PREFIX:-koboko-portfolio}"
TAG_PROJECT="portfolio"
TAG_ENV="prod"
MEDIA_BUCKET="${MEDIA_BUCKET:-koboko-portfolio-media-332ac5}"
SECRET_ID="${SECRET_ID:-koboko/backend}"
ECR_REPO="${ECR_REPO:-koboko-backend}"
API_DOMAIN="${API_DOMAIN:-api.koboko.co.ke}"
HOST_NAME_TAG="$PREFIX-host"

ec2_tag_spec() { # <resource-type> <name>
    echo "ResourceType=$1,Tags=[{Key=Name,Value=$2},{Key=Project,Value=$TAG_PROJECT},{Key=Env,Value=$TAG_ENV}]"
}
TAGS_KV=(Key=Project,Value=$TAG_PROJECT Key=Env,Value=$TAG_ENV)
TAGS_S3="TagSet=[{Key=Project,Value=$TAG_PROJECT},{Key=Env,Value=$TAG_ENV}]"

log() { printf '%s\n' "$*" >&2; }
step() { printf '\n== %s\n' "$*" >&2; }
have() { printf '   exists   %s\n' "$*" >&2; }
plan() { printf '   CREATE   %s\n' "$*" >&2; }
change() { printf '   CHANGE   %s\n' "$*" >&2; }
drop() { printf '   DELETE   %s\n' "$*" >&2; }
warn() { printf '   WARNING  %s\n' "$*" >&2; }

# run <cmd...> — execute a mutating command, or print it in dry-run mode.
run() {
    if [[ "$DRY_RUN" == "true" ]]; then
        printf '   [dry-run] %s\n' "$*" >&2
        return 0
    fi
    "$@"
}

# q <aws args...> — read-only lookup; prints "" on error or None.
q() {
    local out
    out=$(aws "$@" --output text 2>/dev/null) || out=""
    [[ "$out" == "None" ]] && out=""
    printf '%s' "$out"
}

require_identity() {
    local arn
    if ! arn=$(aws sts get-caller-identity --query Arn --output text 2>/dev/null); then
        log "No working AWS credentials for profile '$AWS_PROFILE'."
        exit 1
    fi
    if [[ "$arn" == *":root" ]]; then
        log "Refusing to run as the account root user ($arn)."
        exit 1
    fi
    ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
    BACKUP_BUCKET="${BACKUP_BUCKET:-$PREFIX-backups-$ACCOUNT_ID}"
    log "Identity: $arn"
    log "Account:  $ACCOUNT_ID   Region: $AWS_REGION   Dry run: $DRY_RUN"
}

# host_instance_id — the portfolio host, or "" if none.
host_instance_id() {
    q ec2 describe-instances --filters Name=tag:Name,Values="$HOST_NAME_TAG" \
        Name=instance-state-name,Values=pending,running,stopping,stopped \
        --query 'Reservations[0].Instances[0].InstanceId'
}
