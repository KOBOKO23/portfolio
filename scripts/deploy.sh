#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# deploy.sh — Production deployment helper
# Assumes: git repo, environment variable DEPLOY_HOST set, SSH key configured
# Usage: ./scripts/deploy.sh [production|staging]
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV="${1:-production}"

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'; NC='\033[0m'
die()  { echo -e "${RED}✗${NC} $*"; exit 1; }
ok()   { echo -e "${GREEN}✓${NC} $*"; }
info() { echo -e "${CYAN}▸${NC} $*"; }
warn() { echo -e "${YELLOW}⚠${NC}  $*"; }

echo ""
echo -e "  ${CYAN}Deploying to ${ENV}…${NC}"
echo ""

# ── Pre-flight checks ─────────────────────────────────────────────────────────
[[ -n "$(git status --porcelain)" ]] && warn "Uncommitted changes present — deploy anyway? (Ctrl+C to abort)" && sleep 3

CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
info "Branch: $CURRENT_BRANCH"
info "Commit: $(git rev-parse --short HEAD)"

# ── Build frontend ────────────────────────────────────────────────────────────
info "Building frontend…"
cd "$ROOT/src"
npm run build
ok "Frontend built → dist/"

# ── Collect static ────────────────────────────────────────────────────────────
info "Collecting Django static files…"
cd "$ROOT/backend"
source venv/bin/activate
python manage.py collectstatic --no-input -v 0
ok "Static files collected"

# ── Run migrations ────────────────────────────────────────────────────────────
info "Applying migrations…"
python manage.py migrate -v 0
ok "Migrations applied"

# ── System checks ─────────────────────────────────────────────────────────────
python manage.py check --deploy 2>&1 | grep -E "WARNINGS|ERRORS|OK" || true

# ── Remote deploy (if DEPLOY_HOST is set) ────────────────────────────────────
if [[ -n "${DEPLOY_HOST:-}" ]]; then
  info "Deploying to $DEPLOY_HOST…"
  DEPLOY_PATH="${DEPLOY_PATH:-/var/www/portfolio}"

  ssh "$DEPLOY_HOST" "
    set -e
    cd $DEPLOY_PATH
    git pull origin main
    source venv/bin/activate
    pip install -r backend/requirements.txt -q
    cd backend && python manage.py migrate --no-input -v 0
    python manage.py collectstatic --no-input -v 0
    cd ../src && npm ci && npm run build
    sudo systemctl restart gunicorn portfolio
    sudo systemctl reload nginx
    echo 'Remote deploy complete'
  "
  ok "Remote deploy complete"
else
  warn "DEPLOY_HOST not set — skipping remote deployment"
  info "Set DEPLOY_HOST=user@yourserver.com to enable remote deploy"
fi

echo ""
echo -e "  ${GREEN}Deploy complete!${NC}"
