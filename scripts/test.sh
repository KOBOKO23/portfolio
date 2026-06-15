#!/usr/bin/env bash
# test.sh — Run backend and frontend test suites
# Usage: ./scripts/test.sh [--backend-only] [--frontend-only] [--e2e]
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CYAN='\033[0;36m'; GREEN='\033[0;32m'; NC='\033[0m'
info() { echo -e "${CYAN}▸${NC} $*"; }
ok()   { echo -e "${GREEN}✓${NC} $*"; }

BACKEND=1
FRONTEND=1
E2E=0

for arg in "$@"; do
  case "$arg" in
    --backend-only)  FRONTEND=0; E2E=0 ;;
    --frontend-only) BACKEND=0;  E2E=0 ;;
    --e2e)           E2E=1 ;;
  esac
done

if [[ "$BACKEND" == "1" ]]; then
  info "Running Django tests…"
  cd "$ROOT/backend"
  python manage.py test --verbosity=2
  ok "Backend tests passed"
fi

if [[ "$FRONTEND" == "1" ]]; then
  info "Running Vitest…"
  cd "$ROOT/src"
  npm test
  ok "Frontend tests passed"
fi

if [[ "$E2E" == "1" ]]; then
  info "Running Playwright E2E tests…"
  cd "$ROOT/src"
  npm run test:e2e
  ok "E2E tests passed"
fi

echo ""
echo -e "${GREEN}All tests passed.${NC}"
