#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# setup.sh — One-shot development environment bootstrap
# Run once after cloning: ./scripts/setup.sh
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'; NC='\033[0m'
info()  { echo -e "${CYAN}▸${NC} $*"; }
ok()    { echo -e "${GREEN}✓${NC} $*"; }
warn()  { echo -e "${YELLOW}⚠${NC}  $*"; }
die()   { echo -e "${RED}✗${NC} $*"; exit 1; }

echo ""
echo "  ╔══════════════════════════════════════════╗"
echo "  ║       Portfolio — Dev Setup              ║"
echo "  ╚══════════════════════════════════════════╝"
echo ""

# ── Prerequisites ─────────────────────────────────────────────────────────────
command -v python3 >/dev/null 2>&1 || die "Python 3 not found. Install from python.org"
command -v node    >/dev/null 2>&1 || die "Node.js not found. Install from nodejs.org"
command -v npm     >/dev/null 2>&1 || die "npm not found."

info "Python: $(python3 --version)"
info "Node:   $(node --version)"

# ── Backend ───────────────────────────────────────────────────────────────────
info "Setting up Django backend…"
cd "$ROOT/backend"

if [ ! -d "venv" ]; then
  python3 -m venv venv
  ok "Virtual environment created"
fi

source venv/bin/activate
pip install -r requirements.txt -q
ok "Python dependencies installed"

if [ ! -f ".env" ]; then
  cp .env.example .env
  warn "Created backend/.env — edit it to set OPENWEATHER_API_KEY etc."
fi

python manage.py migrate --run-syncdb -v 0
ok "Database migrated"

python manage.py seed_data
ok "Seed data loaded"

# Create superuser non-interactively if it doesn't exist
python manage.py shell -c "
from django.contrib.auth import get_user_model
U = get_user_model()
if not U.objects.filter(username='admin').exists():
    U.objects.create_superuser('admin', 'admin@portfolio.local', 'admin123')
    print('Superuser created: admin / admin123')
else:
    print('Superuser already exists')
" 2>&1

# ── Frontend ──────────────────────────────────────────────────────────────────
info "Setting up frontend…"
cd "$ROOT/src"

npm install -q
ok "Node dependencies installed"

if [ ! -f ".env" ]; then
  cat > .env <<'EOF'
VITE_API_BASE_URL=http://localhost:8000/api
EOF
  ok "Created src/.env"
fi

# ── Done ──────────────────────────────────────────────────────────────────────
echo ""
echo -e "  ${GREEN}Setup complete!${NC}"
echo ""
echo "  Start the backend:"
echo "    cd backend && source venv/bin/activate && python manage.py runserver"
echo ""
echo "  Start the frontend (new terminal):"
echo "    cd src && npm run dev"
echo ""
echo "  Admin panel:  http://localhost:8000/admin  (admin / admin123)"
echo "  Frontend:     http://localhost:5173"
echo ""
