#!/usr/bin/env bash
set -euo pipefail

# Copy the blog database from a temporary RDS instance (restored from the
# final koboko-db snapshot) into the local 'koboko' database. Uses the old
# DATABASE_URL in the koboko/backend secret for the credentials; nothing is
# printed. Run by infra/aws/restore_blog_db.sh — not usually by hand.
#
# Skips if the local database already has tables, unless FORCE=true.

TEMP_DB_HOST="${TEMP_DB_HOST:?TEMP_DB_HOST is required}"
SECRET_ID="${SECRET_ID:-koboko/backend}"
DRY_RUN="${DRY_RUN:-true}"
FORCE="${FORCE:-false}"

token=$(curl -fsS -X PUT http://169.254.169.254/latest/api/token -H "X-aws-ec2-metadata-token-ttl-seconds: 60")
REGION=$(curl -fsS -H "X-aws-ec2-metadata-token: $token" http://169.254.169.254/latest/meta-data/placement/region)

tables=$(sudo -u postgres psql -d koboko -tAc \
    "SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public'")
if (( tables > 0 )) && [[ "$FORCE" != "true" ]]; then
    echo "Local database koboko already has $tables tables — skipping (FORCE=true to restore over it)."
    exit 0
fi

if [[ "$DRY_RUN" == "true" ]]; then
    echo "[dry-run] would pg_dump the snapshot copy at $TEMP_DB_HOST and pg_restore it into local koboko"
    exit 0
fi

# Old connection details, with the host swapped for the temporary instance.
read -r OLD_USER OLD_DB OLD_PORT < <(
    aws secretsmanager get-secret-value --region "$REGION" --secret-id "$SECRET_ID" \
        --query SecretString --output text |
        python3 -c 'import sys, json, urllib.parse as u
p = u.urlparse(json.load(sys.stdin)["DATABASE_URL"])
print(u.unquote(p.username), p.path.lstrip("/"), p.port or 5432)'
)
OLD_PASSWORD=$(
    aws secretsmanager get-secret-value --region "$REGION" --secret-id "$SECRET_ID" \
        --query SecretString --output text |
        python3 -c 'import sys, json, urllib.parse as u
print(u.unquote(u.urlparse(json.load(sys.stdin)["DATABASE_URL"]).password or ""))'
)
NEW_PASSWORD=$(sed -n 's#^DATABASE_URL=postgresql://koboko:\([^@]*\)@.*#\1#p' /etc/koboko/db.env)

dump=$(umask 077 && mktemp /var/tmp/koboko-restore.XXXXXX)
trap 'rm -f "$dump"' EXIT

echo "Dumping $OLD_DB from $TEMP_DB_HOST ..."
PGPASSWORD="$OLD_PASSWORD" PGSSLMODE=require pg_dump -h "$TEMP_DB_HOST" -p "$OLD_PORT" -U "$OLD_USER" -d "$OLD_DB" \
    --format=custom --no-owner --no-acl --file "$dump"
unset OLD_PASSWORD
echo "Dump size: $(du -h "$dump" | cut -f1)"

if (( tables > 0 )); then
    echo "FORCE=true: dropping and recreating local koboko schema"
    sudo -u postgres psql -d koboko -v ON_ERROR_STOP=1 -qc "DROP SCHEMA public CASCADE; CREATE SCHEMA public AUTHORIZATION koboko;"
fi

echo "Restoring into local koboko ..."
PGPASSWORD="$NEW_PASSWORD" pg_restore -h 127.0.0.1 -U koboko -d koboko --no-owner --no-acl --exit-on-error "$dump"
unset NEW_PASSWORD

sudo -u postgres psql -d koboko -qc "ANALYZE;"
echo "Largest tables after restore (rows):"
sudo -u postgres psql -d koboko -tAc \
    "SELECT relname || ': ' || n_live_tup FROM pg_stat_user_tables ORDER BY n_live_tup DESC LIMIT 12" | sed 's/^/   /'
