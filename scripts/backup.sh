#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# backup.sh — Back up the database and media files
# Usage: ./scripts/backup.sh [--full]
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKUP_DIR="$ROOT/backups"
TIMESTAMP="$(date +%Y%m%d_%H%M%S)"
FULL=${1:-""}

GREEN='\033[0;32m'; CYAN='\033[0;36m'; NC='\033[0m'
ok() { echo -e "${GREEN}✓${NC} $*"; }
info() { echo -e "${CYAN}▸${NC} $*"; }

mkdir -p "$BACKUP_DIR"

cd "$ROOT/backend"
source venv/bin/activate

DB_ENGINE=$(grep -E '^DB_ENGINE' .env 2>/dev/null | cut -d= -f2 || echo "sqlite")

info "Backing up database (engine: ${DB_ENGINE:-sqlite})…"

if [[ "${DB_ENGINE:-sqlite}" == "postgresql" ]]; then
  # PostgreSQL dump
  DB_NAME=$(grep '^DB_NAME' .env | cut -d= -f2)
  DB_USER=$(grep '^DB_USER' .env | cut -d= -f2)
  BACKUP_FILE="$BACKUP_DIR/db_pg_${TIMESTAMP}.sql.gz"
  PGPASSWORD=$(grep '^DB_PASSWORD' .env | cut -d= -f2) \
    pg_dump -U "$DB_USER" "$DB_NAME" | gzip > "$BACKUP_FILE"
  ok "PostgreSQL dump → $BACKUP_FILE"
else
  # SQLite copy
  BACKUP_FILE="$BACKUP_DIR/db_sqlite_${TIMESTAMP}.sqlite3"
  cp db.sqlite3 "$BACKUP_FILE"
  ok "SQLite copy → $BACKUP_FILE"
fi

# Django data fixture (always)
FIXTURE_FILE="$BACKUP_DIR/data_fixture_${TIMESTAMP}.json.gz"
python manage.py dumpdata --natural-foreign --natural-primary \
  --exclude auth.permission --exclude contenttypes \
  --indent 2 | gzip > "$FIXTURE_FILE"
ok "Django fixture → $FIXTURE_FILE"

if [[ "$FULL" == "--full" ]]; then
  info "Backing up media files…"
  MEDIA_FILE="$BACKUP_DIR/media_${TIMESTAMP}.tar.gz"
  tar -czf "$MEDIA_FILE" -C "$ROOT/backend" media/
  ok "Media archive → $MEDIA_FILE"
fi

# Keep only last 10 backups of each type
info "Pruning old backups (keeping 10)…"
ls -t "$BACKUP_DIR"/db_*.sqlite3 2>/dev/null | tail -n +11 | xargs rm -f || true
ls -t "$BACKUP_DIR"/db_pg_*.sql.gz 2>/dev/null | tail -n +11 | xargs rm -f || true
ls -t "$BACKUP_DIR"/data_fixture_*.json.gz 2>/dev/null | tail -n +11 | xargs rm -f || true
ok "Pruned"

echo ""
echo -e "${GREEN}Backup complete — $BACKUP_DIR${NC}"
ls -lh "$BACKUP_DIR" | tail -5
