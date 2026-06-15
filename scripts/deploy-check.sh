#!/usr/bin/env bash
# deploy-check.sh — Pre-deploy validation gate; exits 1 if anything fails
# Usage: ./scripts/deploy-check.sh
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
RED='\033[0;31m'; GREEN='\033[0;32m'; CYAN='\033[0;36m'; NC='\033[0m'
PASS=0; FAIL=0
ok()   { echo -e "  ${GREEN}✓${NC} $*"; ((PASS++)) || true; }
fail() { echo -e "  ${RED}✗${NC} $*"; ((FAIL++)) || true; }
info() { echo -e "${CYAN}▸${NC} $*"; }

echo ""
echo "  Portfolio — Pre-Deploy Validation"
echo "  ──────────────────────────────────"
echo ""

# ── Backend ───────────────────────────────────────────────────────────────────
info "Backend…"
cd "$ROOT/backend"

if SECRET_KEY=ci-check DEBUG=False ALLOWED_HOSTS=localhost \
     python manage.py check --deploy --fail-level WARNING 2>/dev/null; then
  ok "Django deploy check"
else
  fail "Django deploy check failed"
fi

PENDING=$(python manage.py showmigrations --list 2>/dev/null | grep '\[ \]' | wc -l | tr -d '[:space:]')
if [[ "$PENDING" == "0" ]]; then
  ok "No pending migrations"
else
  fail "$PENDING pending migration(s) — run scripts/migrate.sh"
fi

if pip check 2>&1 | grep -q "No broken requirements"; then
  ok "pip dependency check"
else
  fail "pip check — broken requirements detected"
fi

# ── Frontend ──────────────────────────────────────────────────────────────────
info "Frontend…"
cd "$ROOT/src"

if npm run typecheck 2>/dev/null; then
  ok "TypeScript"
else
  fail "TypeScript errors"
fi

if npm run build 2>/dev/null; then
  ok "Vite production build"
else
  fail "Vite build failed"
fi

# ── Summary ───────────────────────────────────────────────────────────────────
echo ""
echo "  ──────────────────────────────────"
echo -e "  Passed: ${GREEN}${PASS}${NC}   Failed: ${RED}${FAIL}${NC}"
echo ""

if [[ "$FAIL" -gt 0 ]]; then
  echo -e "  ${RED}Deploy check FAILED — resolve all issues before pushing.${NC}"
  exit 1
fi

echo -e "  ${GREEN}All checks passed — safe to deploy.${NC}"
