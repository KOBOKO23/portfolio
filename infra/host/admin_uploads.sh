#!/usr/bin/env bash
set -euo pipefail

# One-off for hosts set up before admin bulk uploads existed: allow 200 MB
# requests and 5-minute timeouts on /admin/ only (the public API stays at
# 20 MB), and raise gunicorn's worker timeout to match. setup.sh does the same
# for new hosts. Idempotent.
#
#   bash infra/aws/run_on_host.sh infra/host/admin_uploads.sh

SITE=/etc/nginx/sites-available/koboko
UNIT=/etc/systemd/system/koboko-backend.service
APP_PORT="${APP_PORT:-8001}"

if grep -q 'location /admin/' "$SITE"; then
    echo "nginx: /admin/ block already present"
else
    cp "$SITE" "$SITE.bak.$(date +%s)"
    python3 - "$SITE" "$APP_PORT" <<'PY'
import sys
path, port = sys.argv[1], sys.argv[2]
s = open(path).read()
anchor = "    location / {\n"
block = f"""    # Admin bulk photo uploads: up to 25 phone photos in one request.
    location /admin/ {{
        client_max_body_size 200M;
        proxy_pass http://127.0.0.1:{port};
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_read_timeout 300s;
    }}

"""
assert s.count(anchor) == 1, "expected exactly one 'location /' block"
open(path, "w").write(s.replace(anchor, block + anchor, 1))
PY
    nginx -t
    systemctl reload nginx
    echo "nginx: added /admin/ block (200M, 300s)"
fi

if grep -q -- '--timeout 120' "$UNIT"; then
    sed -i 's/--timeout 120/--timeout 300/' "$UNIT"
    systemctl daemon-reload
    systemctl restart koboko-backend
    echo "gunicorn: timeout raised to 300s"
else
    echo "gunicorn: timeout already adjusted"
fi
