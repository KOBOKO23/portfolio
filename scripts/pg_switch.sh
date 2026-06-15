#!/usr/bin/env bash
# pg_switch.sh — Switch from SQLite to PostgreSQL and migrate all data
# Prerequisites: PostgreSQL running locally, createdb available
# Usage: ./scripts/pg_switch.sh [dbname] [dbuser]
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DB_NAME="${1:-portfolio}"
DB_USER="${2:-postgres}"

GREEN='\033[0;32m'; CYAN='\033[0;36m'; YELLOW='\033[1;33m'; NC='\033[0m'
ok()   { echo -e "${GREEN}✓${NC} $*"; }
info() { echo -e "${CYAN}▸${NC} $*"; }
warn() { echo -e "${YELLOW}⚠${NC}  $*"; }

cd "$ROOT/backend"

info "Exporting data from SQLite…"
python3 manage.py dumpdata \
  --natural-foreign --natural-primary \
  --exclude auth.permission --exclude contenttypes \
  --indent 2 > /tmp/portfolio_data_export.json
ok "Data exported to /tmp/portfolio_data_export.json"

info "Creating PostgreSQL database '$DB_NAME'…"
createdb -U "$DB_USER" "$DB_NAME" 2>/dev/null && ok "Database created" || warn "Database may already exist, continuing…"

info "Updating .env for PostgreSQL…"
update_env() {
  local key=$1 val=$2 envfile="$ROOT/backend/.env"
  if grep -q "^${key}=" "$envfile" 2>/dev/null; then
    sed -i.bak "s|^${key}=.*|${key}=${val}|" "$envfile" && rm -f "${envfile}.bak"
  else
    echo "${key}=${val}" >> "$envfile"
  fi
}

update_env "DB_ENGINE"   "postgresql"
update_env "DB_NAME"     "$DB_NAME"
update_env "DB_USER"     "$DB_USER"
update_env "DB_PASSWORD" ""
update_env "DB_HOST"     "localhost"
update_env "DB_PORT"     "5432"
ok ".env updated"

info "Running migrations on PostgreSQL…"
python3 manage.py migrate -v 0
ok "Migrations complete"

info "Loading data into PostgreSQL…"
python3 manage.py loaddata /tmp/portfolio_data_export.json
ok "Data loaded"

info "Verifying…"
python3 manage.py shell -c "
from apps.blog.models import BlogArticle
from apps.core.models import Profile
print(f'  Articles: {BlogArticle.objects.count()}')
print(f'  Profile:  {Profile.objects.first()}')
"

echo ""
echo -e "  ${GREEN}Migration to PostgreSQL complete!${NC}"
echo "  Connection: postgresql://$DB_USER@localhost/$DB_NAME"
