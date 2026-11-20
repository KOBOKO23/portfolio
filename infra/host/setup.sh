#!/usr/bin/env bash
set -euo pipefail

# Idempotent setup of the portfolio host (EC2 t4g.micro, Ubuntu 24.04 arm64):
# 2 GB swap, Docker, nginx + Let's Encrypt, PostgreSQL 16 (localhost only),
# the koboko-backend container as a systemd service, nightly pg_dump to S3.
# Run it from the laptop through SSM (see infra/README.md):
#
#   bash infra/aws/run_on_host.sh infra/host/setup.sh                 # dry run
#   bash infra/aws/run_on_host.sh infra/host/setup.sh DRY_RUN=false
#
# Installs two commands used afterwards:
#   koboko-deploy   pull the image, refresh env from Secrets Manager, migrate, restart
#   koboko-pg-backup  pg_dump the local database to s3://$BACKUP_BUCKET/pg/

API_DOMAIN="${API_DOMAIN:-api.koboko.co.ke}"
CERTBOT_EMAIL="${CERTBOT_EMAIL:-kobokophilip@gmail.com}"
BACKUP_BUCKET="${BACKUP_BUCKET:?BACKUP_BUCKET is passed in by run_on_host.sh}"
SECRET_ID="${SECRET_ID:-koboko/backend}"
ECR_REPO="${ECR_REPO:-koboko-backend}"
SWAP_SIZE_GB="${SWAP_SIZE_GB:-2}"
GUNICORN_WORKERS="${GUNICORN_WORKERS:-2}"
APP_PORT="${APP_PORT:-8001}"
DRY_RUN="${DRY_RUN:-true}"
ETC=/etc/koboko

step() { printf '\n== %s\n' "$*"; }
have() { printf '   done     %s\n' "$*"; }
todo() { printf '   TODO     %s\n' "$*"; }
apply() { [[ "$DRY_RUN" != "true" ]]; }

token=$(curl -fsS -X PUT http://169.254.169.254/latest/api/token -H "X-aws-ec2-metadata-token-ttl-seconds: 300")
imds() { curl -fsS -H "X-aws-ec2-metadata-token: $token" "http://169.254.169.254/latest/$1"; }
REGION=$(imds meta-data/placement/region)
ACCOUNT_ID=$(imds dynamic/instance-identity/document | sed -n 's/.*"accountId" *: *"\([0-9]*\)".*/\1/p')
IMAGE="$ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com/$ECR_REPO:latest"

step "${SWAP_SIZE_GB} GB swap"
if swapon --show=NAME --noheadings | grep -qx /swapfile; then
    have "swap on /swapfile"
else
    todo "create /swapfile, enable at boot, vm.swappiness=10"
    if apply; then
        fallocate -l "${SWAP_SIZE_GB}G" /swapfile
        chmod 600 /swapfile
        mkswap /swapfile
        swapon /swapfile
        grep -q '^/swapfile ' /etc/fstab || echo '/swapfile none swap sw 0 0' >>/etc/fstab
        echo 'vm.swappiness=10' >/etc/sysctl.d/99-swap.conf
        sysctl -p /etc/sysctl.d/99-swap.conf
    fi
fi

step "Packages: Docker, nginx, certbot, PostgreSQL 16, AWS CLI v2"
missing=()
for pkg in docker.io nginx certbot python3-certbot-nginx postgresql-16 jq unzip; do
    dpkg -s "$pkg" >/dev/null 2>&1 || missing+=("$pkg")
done
if ((${#missing[@]})); then
    todo "apt install ${missing[*]}"
    apply && { apt-get update && DEBIAN_FRONTEND=noninteractive apt-get install -y "${missing[@]}"; }
else
    have "all apt packages present"
fi
if command -v aws >/dev/null 2>&1; then
    have "aws cli"
else
    todo "install AWS CLI v2 ($(uname -m))"
    if apply; then
        tmp=$(mktemp -d)
        curl -fsS -o "$tmp/awscliv2.zip" "https://awscli.amazonaws.com/awscli-exe-linux-$(uname -m).zip"
        unzip -q "$tmp/awscliv2.zip" -d "$tmp"
        "$tmp/aws/install"
        rm -rf "$tmp"
    fi
fi
if [[ -f /etc/docker/daemon.json ]]; then
    have "docker log rotation"
else
    todo "docker log rotation (10 MB x 3 per container)"
    if apply; then
        echo '{"log-driver":"json-file","log-opts":{"max-size":"10m","max-file":"3"}}' >/etc/docker/daemon.json
        systemctl restart docker
    fi
fi

step "PostgreSQL database 'koboko' (localhost only)"
if [[ -f "$ETC/db.env" ]]; then
    have "role and database (credentials in $ETC/db.env)"
else
    todo "create role + database koboko, password generated into $ETC/db.env (0600)"
    if apply; then
        install -d -m 700 "$ETC"
        pass=$(openssl rand -hex 24)
        sudo -u postgres psql -v ON_ERROR_STOP=1 -q <<SQL
DO \$\$ BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'koboko') THEN
    CREATE ROLE koboko LOGIN PASSWORD '$pass';
  ELSE
    ALTER ROLE koboko PASSWORD '$pass';
  END IF;
END \$\$;
SQL
        sudo -u postgres psql -tAc "SELECT 1 FROM pg_database WHERE datname = 'koboko'" | grep -q 1 ||
            sudo -u postgres createdb -O koboko koboko
        (umask 077 && echo "DATABASE_URL=postgresql://koboko:$pass@127.0.0.1:5432/koboko" >"$ETC/db.env")
        unset pass
    fi
fi
if apply || [[ -d /etc/postgresql/16 ]]; then
    grep -Eq "^listen_addresses *= *'localhost'|^#listen_addresses" /etc/postgresql/16/main/postgresql.conf &&
        have "PostgreSQL listens on localhost only" ||
        echo "   WARNING  check listen_addresses in /etc/postgresql/16/main/postgresql.conf"
    grep -Eq '^ssl *= *on' /etc/postgresql/16/main/postgresql.conf &&
        have "PostgreSQL ssl=on (the app connects with sslmode=require)" ||
        echo "   WARNING  ssl is off; the app requires sslmode=require"
fi

step "App settings (non-secret) -> $ETC/app.env"
todo "write $ETC/app.env"
if apply; then
    install -d -m 700 "$ETC"
    cat >"$ETC/app.env" <<EOF
DEBUG=False
ALLOWED_HOSTS=$API_DOMAIN,127.0.0.1,localhost
SITE_URL=https://koboko.co.ke
CORS_ALLOWED_ORIGINS=https://koboko.co.ke,https://www.koboko.co.ke,https://src-blush-kappa.vercel.app
CSRF_TRUSTED_ORIGINS=https://$API_DOMAIN,https://koboko.co.ke,https://www.koboko.co.ke,https://src-blush-kappa.vercel.app
USE_S3=True
AWS_S3_REGION_NAME=$REGION
AWS_STORAGE_BUCKET_NAME=koboko-portfolio-media-332ac5
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
DEFAULT_FROM_EMAIL=Koboko Newsletter <kobokophilip@gmail.com>
ADMIN_EMAIL=info@koboko.co.ke
DARAJA_ENV=sandbox
EOF
    chmod 600 "$ETC/app.env"
fi

step "Commands: koboko-render-env, koboko-deploy, koboko-pg-backup"
todo "install /usr/local/bin/koboko-{render-env,deploy,pg-backup}"
if apply; then
    cat >/usr/local/bin/koboko-render-env <<EOF
#!/usr/bin/env bash
# Build $ETC/backend.env for the container: app.env, then every key of the
# $SECRET_ID secret except DATABASE_URL, then the local db.env. Never prints values.
set -euo pipefail
umask 077
secret=\$(aws secretsmanager get-secret-value --region $REGION --secret-id $SECRET_ID --query SecretString --output text)
if jq -e 'to_entries[] | select(.value | tostring | test("\\n"))' <<<"\$secret" >/dev/null; then
    echo "A value in $SECRET_ID contains a newline; docker --env-file cannot hold it." >&2
    exit 1
fi
tmp=\$(mktemp $ETC/backend.env.XXXXXX)
{
    cat $ETC/app.env
    jq -r 'to_entries[] | select(.key != "DATABASE_URL") | "\(.key)=\(.value)"' <<<"\$secret"
    cat $ETC/db.env
} >"\$tmp"
mv -f "\$tmp" $ETC/backend.env
EOF
    cat >/usr/local/bin/koboko-deploy <<EOF
#!/usr/bin/env bash
# Pull $IMAGE, refresh settings, run migrations, restart, health-check.
set -euo pipefail
aws ecr get-login-password --region $REGION | docker login --username AWS --password-stdin ${IMAGE%%/*} >/dev/null
docker pull -q $IMAGE
koboko-render-env
docker run --rm --network host --env-file $ETC/backend.env $IMAGE python manage.py migrate --noinput
systemctl restart koboko-backend
for _ in \$(seq 1 20); do
    if curl -fsS -H "Host: $API_DOMAIN" http://127.0.0.1:$APP_PORT/api/health/ >/dev/null; then
        echo "koboko-backend healthy"; exit 0
    fi
    sleep 3
done
echo "koboko-backend failed its health check" >&2
journalctl -u koboko-backend -n 30 --no-pager >&2
exit 1
EOF
    cat >/usr/local/bin/koboko-pg-backup <<EOF
#!/usr/bin/env bash
# Nightly logical backup of the local koboko database to s3://$BACKUP_BUCKET/pg/
# (the host may only write there; the bucket lifecycle expires old dumps).
set -euo pipefail
dump=\$(umask 077 && mktemp /var/tmp/koboko-pg.XXXXXX)
trap 'rm -f "\$dump"' EXIT
sudo -u postgres pg_dump --format=custom --no-owner --no-acl koboko >"\$dump"
pg_restore --list "\$dump" >/dev/null
key="pg/koboko-\$(date -u +%Y%m%dT%H%M%SZ).dump"
aws s3 cp "\$dump" "s3://$BACKUP_BUCKET/\$key" --region $REGION --only-show-errors
echo "Backup uploaded: s3://$BACKUP_BUCKET/\$key (\$(du -h "\$dump" | cut -f1))"
EOF
    chmod 755 /usr/local/bin/koboko-render-env /usr/local/bin/koboko-deploy /usr/local/bin/koboko-pg-backup
fi

step "systemd: koboko-backend (container on 127.0.0.1:$APP_PORT) and nightly backup timer"
todo "write koboko-backend.service, koboko-pg-backup.{service,timer}"
if apply; then
    cat >/etc/systemd/system/koboko-backend.service <<EOF
[Unit]
Description=Portfolio backend (koboko-backend container)
After=docker.service postgresql.service network-online.target
Requires=docker.service
Wants=postgresql.service

[Service]
Restart=always
RestartSec=5
ExecStartPre=-/usr/bin/docker rm -f koboko-backend
ExecStart=/usr/bin/docker run --rm --name koboko-backend --network host --memory 600m \\
    --env-file $ETC/backend.env $IMAGE \\
    gunicorn config.wsgi:application --bind 127.0.0.1:$APP_PORT --workers $GUNICORN_WORKERS \\
    --timeout 300 --access-logfile - --error-logfile -
ExecStop=/usr/bin/docker stop koboko-backend

[Install]
WantedBy=multi-user.target
EOF
    cat >/etc/systemd/system/koboko-pg-backup.service <<EOF
[Unit]
Description=Nightly pg_dump of the portfolio database to S3
After=postgresql.service

[Service]
Type=oneshot
ExecStart=/usr/local/bin/koboko-pg-backup
EOF
    cat >/etc/systemd/system/koboko-pg-backup.timer <<EOF
[Unit]
Description=Run koboko-pg-backup nightly

[Timer]
OnCalendar=*-*-* 02:30:00 UTC
Persistent=true
RandomizedDelaySec=10m

[Install]
WantedBy=timers.target
EOF
    systemctl daemon-reload
    systemctl enable koboko-backend.service
    systemctl enable --now koboko-pg-backup.timer
fi

step "nginx site for $API_DOMAIN"
site=/etc/nginx/sites-available/koboko
if [[ -f "$site" ]]; then
    have "$site (certbot edits it in place; delete it to regenerate)"
else
    todo "write $site: proxy to 127.0.0.1:$APP_PORT with X-Forwarded-Proto"
    if apply; then
        cat >"$site" <<EOF
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name _;
    return 444;  # drop requests for any other Host (IP scanners)
}

server {
    listen 80;
    listen [::]:80;
    server_name $API_DOMAIN;
    server_tokens off;
    client_max_body_size 20M;

    # Admin bulk photo uploads: up to 25 phone photos in one request.
    location /admin/ {
        client_max_body_size 200M;
        proxy_pass http://127.0.0.1:$APP_PORT;
        proxy_set_header Host \$host;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_read_timeout 300s;
    }

    location / {
        proxy_pass http://127.0.0.1:$APP_PORT;
        proxy_set_header Host \$host;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_read_timeout 120s;
    }
}
EOF
        ln -sfn "$site" /etc/nginx/sites-enabled/koboko
        rm -f /etc/nginx/sites-enabled/default
        nginx -t
        systemctl reload nginx
    fi
fi

step "TLS certificate for $API_DOMAIN"
if [[ -d "/etc/letsencrypt/live/$API_DOMAIN" ]]; then
    have "certificate (renewed by certbot.timer)"
else
    public_ip=$(imds meta-data/public-ipv4 || true)
    resolved=$(getent ahostsv4 "$API_DOMAIN" | awk 'NR==1{print $1}' || true)
    if [[ -n "$public_ip" && "$resolved" == "$public_ip" ]]; then
        todo "certbot --nginx for $API_DOMAIN (notices to $CERTBOT_EMAIL)"
        apply && certbot --nginx -d "$API_DOMAIN" -m "$CERTBOT_EMAIL" --agree-tos --no-eff-email --redirect -n
    else
        echo "   WAITING  $API_DOMAIN resolves to '${resolved:-nothing}', this host is '${public_ip:-unknown}'."
        echo "            Point the DNS A record at this host, then re-run setup."
    fi
fi

step "Next"
echo "   First time: restore the blog (infra/aws/restore_blog_db.sh), then run 'koboko-deploy' on the host."
[[ "$DRY_RUN" == "true" ]] && echo "   Dry run only — nothing was changed."
exit 0
