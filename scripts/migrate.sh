#!/usr/bin/env bash
# migrate.sh — Run Django migrations safely with a pending-check first
# Usage: ./scripts/migrate.sh
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CYAN='\033[0;36m'; GREEN='\033[0;32m'; NC='\033[0m'
info() { echo -e "${CYAN}▸${NC} $*"; }
ok()   { echo -e "${GREEN}✓${NC} $*"; }

cd "$ROOT/backend"

info "Checking for pending migrations…"
PENDING=$(python manage.py showmigrations --list 2>/dev/null | grep '\[ \]' | wc -l | tr -d '[:space:]')

if [[ "$PENDING" == "0" ]]; then
  ok "No pending migrations."
  exit 0
fi

echo "  Pending: $PENDING migration(s)"
info "Running migrations…"
python manage.py migrate --verbosity=1

ok "Migrations complete."
