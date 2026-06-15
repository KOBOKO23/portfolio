#!/usr/bin/env bash
# createsuperuser.sh — Non-interactive Django superuser creation
# Env vars: DJANGO_SU_USERNAME, DJANGO_SU_EMAIL, DJANGO_SU_PASSWORD
# Usage: ./scripts/createsuperuser.sh
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
GREEN='\033[0;32m'; NC='\033[0m'
ok() { echo -e "${GREEN}✓${NC} $*"; }

SU_USERNAME="${DJANGO_SU_USERNAME:-admin}"
SU_EMAIL="${DJANGO_SU_EMAIL:-admin@portfolio.local}"
SU_PASSWORD="${DJANGO_SU_PASSWORD:-admin123}"

cd "$ROOT/backend"

python manage.py shell -c "
from django.contrib.auth import get_user_model
U = get_user_model()
if U.objects.filter(username='${SU_USERNAME}').exists():
    print('Superuser already exists — skipping.')
else:
    U.objects.create_superuser('${SU_USERNAME}', '${SU_EMAIL}', '${SU_PASSWORD}')
    print('Superuser created: ${SU_USERNAME} / ${SU_EMAIL}')
"
ok "Done"
