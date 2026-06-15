#!/usr/bin/env bash
# lint.sh — Run all linters: ruff (backend) + ESLint / TypeScript / Prettier (frontend)
# Usage: ./scripts/lint.sh [--fix]
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CYAN='\033[0;36m'; GREEN='\033[0;32m'; NC='\033[0m'
info() { echo -e "${CYAN}▸${NC} $*"; }
ok()   { echo -e "${GREEN}✓${NC} $*"; }

FIX=${1:-""}

info "Backend — ruff check…"
cd "$ROOT/backend"
if [[ "$FIX" == "--fix" ]]; then
  ruff check . --fix
else
  ruff check . --output-format=concise
fi
ok "ruff check passed"

info "Backend — ruff format…"
if [[ "$FIX" == "--fix" ]]; then
  ruff format .
else
  ruff format --check .
fi
ok "ruff format passed"

info "Frontend — ESLint…"
cd "$ROOT/src"
npm run lint
ok "ESLint passed"

info "Frontend — TypeScript…"
npm run typecheck
ok "TypeScript passed"

info "Frontend — Prettier…"
npm run format:check
ok "Prettier passed"

echo ""
echo -e "${GREEN}All linters passed.${NC}"
