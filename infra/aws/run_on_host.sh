#!/usr/bin/env bash
# Run a local script on the portfolio host as root through SSM Run Command —
# no SSH or open port needed. Prints the script's output and exits with its status.
#
#   bash infra/aws/run_on_host.sh infra/host/setup.sh                   # host scripts dry-run by default
#   bash infra/aws/run_on_host.sh infra/host/setup.sh DRY_RUN=false
#
# Extra KEY=value arguments become environment variables for the script.
# They are visible in SSM command history, so never pass secrets this way.

source "$(dirname "$0")/lib.sh"
require_identity

SCRIPT="${1:?Usage: run_on_host.sh <local-script> [KEY=value ...]}"
shift
[[ -r "$SCRIPT" ]] || { log "No such script: $SCRIPT"; exit 1; } # /dev/stdin works for one-liners
env_prefix=""
for kv in "$@"; do
    [[ "$kv" =~ ^[A-Z_][A-Z0-9_]*=[A-Za-z0-9._:/@,+-]*$ ]] || { log "Bad argument (KEY=value, no spaces/quotes): $kv"; exit 1; }
    env_prefix+="$kv "
done

INSTANCE_ID=$(host_instance_id)
[[ -n "$INSTANCE_ID" ]] || { log "No $HOST_NAME_TAG instance — run infra/aws/provision.sh first."; exit 1; }

name=$(basename "$SCRIPT")
params=$(jq -n --arg b64 "$(base64 <"$SCRIPT" | tr -d '\n')" --arg name "$name" --arg env "$env_prefix" \
    --arg domain "$API_DOMAIN" --arg bucket "$BACKUP_BUCKET" '{commands: [
        "set -e",
        "mkdir -p /opt/koboko/infra",
        ("echo " + $b64 + " | base64 -d > /opt/koboko/infra/" + $name),
        ("cd /opt/koboko/infra && env API_DOMAIN=" + $domain + " BACKUP_BUCKET=" + $bucket + " " + $env
            + "bash /opt/koboko/infra/" + $name)
    ], executionTimeout: ["3600"]}')
f=$(mktemp)
trap 'rm -f "$f"' EXIT
echo "$params" >"$f"

cmd_id=$(aws ssm send-command --instance-ids "$INSTANCE_ID" --document-name AWS-RunShellScript \
    --comment "run_on_host $name" --parameters "file://$f" --query Command.CommandId --output text)
log "-> $name on $INSTANCE_ID (SSM command $cmd_id)"

status=Pending
while [[ "$status" == Pending || "$status" == InProgress || "$status" == Delayed ]]; do
    sleep 5
    status=$(q ssm get-command-invocation --command-id "$cmd_id" --instance-id "$INSTANCE_ID" --query Status)
    status=${status:-Pending}
done
aws ssm get-command-invocation --command-id "$cmd_id" --instance-id "$INSTANCE_ID" \
    --query StandardOutputContent --output text
err=$(q ssm get-command-invocation --command-id "$cmd_id" --instance-id "$INSTANCE_ID" --query StandardErrorContent)
[[ -n "$err" ]] && printf '%s\n' "--- stderr" "$err" >&2
log "-> $status"
[[ "$status" == Success ]]
