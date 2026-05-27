#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# dev.sh — Start both backend and frontend in parallel
# Usage: ./scripts/dev.sh
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CYAN='\033[0;36m'; GREEN='\033[0;32m'; NC='\033[0m'

cleanup() {
  echo ""
  echo -e "${CYAN}Shutting down…${NC}"
  kill "$BACKEND_PID" "$FRONTEND_PID" 2>/dev/null || true
  exit 0
}
trap cleanup SIGINT SIGTERM

echo ""
echo -e "  ${GREEN}Starting Portfolio Dev Stack${NC}"
echo -e "  Backend  → http://localhost:8000"
echo -e "  Frontend → http://localhost:5173"
echo -e "  Admin    → http://localhost:8000/admin"
echo ""

# ── Backend ───────────────────────────────────────────────────────────────────
cd "$ROOT/backend"
source venv/bin/activate
python manage.py migrate -v 0 2>/dev/null
python manage.py runserver 8000 2>&1 | sed 's/^/  [backend] /' &
BACKEND_PID=$!

sleep 1

# ── Frontend ──────────────────────────────────────────────────────────────────
cd "$ROOT/src"
npm run dev 2>&1 | sed 's/^/  [frontend] /' &
FRONTEND_PID=$!

echo -e "  ${CYAN}PIDs: backend=$BACKEND_PID  frontend=$FRONTEND_PID${NC}"
echo -e "  Press Ctrl+C to stop both"
echo ""

wait
