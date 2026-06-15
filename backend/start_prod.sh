#!/usr/bin/env bash
# Production start command — used directly as Render's Start Command.
# Render installs packages into its own managed Python environment during the
# build step, so there is no virtualenv to activate here.
#
# Render Start Command (set in dashboard or render.yaml):
#   bash backend/start_prod.sh
#
# Build Command (set in dashboard or render.yaml):
#   pip install -r backend/requirements.txt &&
#   python backend/manage.py collectstatic --noinput &&
#   python backend/manage.py migrate --noinput
set -e
cd "$(dirname "$0")"

exec gunicorn config.wsgi:application \
  --bind "0.0.0.0:${PORT:-8000}" \
  --workers "${GUNICORN_WORKERS:-4}" \
  --timeout 120 \
  --access-logfile - \
  --error-logfile -
