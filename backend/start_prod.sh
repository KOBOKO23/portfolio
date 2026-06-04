#!/usr/bin/env bash
# Production startup — gunicorn + static files
set -e
cd "$(dirname "$0")"
source venv/bin/activate
python manage.py migrate --noinput
python manage.py collectstatic --noinput
exec gunicorn config.wsgi:application \
  --bind 0.0.0.0:${PORT:-8000} \
  --workers ${GUNICORN_WORKERS:-4} \
  --timeout 120 \
  --access-logfile - \
  --error-logfile -
