#!/usr/bin/env bash
# ──────────────────────────────────────────────────────────────────────────────
#  vercel_deploy.sh — Deploy the React frontend to Vercel
#
#  Two modes:
#    --setup   First-time: installs CLI, links project, sets env vars
#    --deploy  Subsequent deploys (production)
#
#  Usage:
#    export VITE_API_BASE_URL=https://api.koboko.dev/api
#    ./scripts/vercel_deploy.sh --setup    # run once
#    ./scripts/vercel_deploy.sh --deploy   # run on every release
# ──────────────────────────────────────────────────────────────────────────────
set -euo pipefail

log()  { printf '\033[1;36m▶ %s\033[0m\n' "$*"; }
ok()   { printf '\033[1;32m✓ %s\033[0m\n' "$*"; }
err()  { printf '\033[1;31m✗ %s\033[0m\n' "$*" >&2; exit 1; }

: "${VITE_API_BASE_URL:?Set VITE_API_BASE_URL (e.g. https://api.koboko.dev/api)}"

MODE="${1:---deploy}"
FRONTEND_DIR="$(cd "$(dirname "$0")/../src" && pwd)"

setup() {
    log "Installing Vercel CLI..."
    npm install -g vercel 2>/dev/null || err "npm install -g vercel failed — is Node.js installed?"
    ok "Vercel CLI installed"

    log "Logging in to Vercel..."
    vercel login

    log "Linking project (run from src/)..."
    cd "$FRONTEND_DIR"
    vercel link

    : "${VITE_SITE_URL:=https://koboko.dev}"
    : "${VITE_GITHUB_URL:=https://github.com/KOBOKO23}"
    : "${VITE_TWITTER_HANDLE:=}"

    log "Setting environment variables on Vercel..."
    echo "$VITE_API_BASE_URL" | vercel env add VITE_API_BASE_URL production
    echo "$VITE_SITE_URL"     | vercel env add VITE_SITE_URL production
    echo "$VITE_GITHUB_URL"   | vercel env add VITE_GITHUB_URL production
    [ -n "$VITE_TWITTER_HANDLE" ] && echo "$VITE_TWITTER_HANDLE" | vercel env add VITE_TWITTER_HANDLE production || true
    echo "$VITE_API_BASE_URL" | vercel env add VITE_API_BASE_URL preview || true
    echo "$VITE_SITE_URL"     | vercel env add VITE_SITE_URL preview || true
    echo "http://localhost:8000/api" | vercel env add VITE_API_BASE_URL development || true

    ok "Setup complete."
    printf '\n'
    printf '  Next:\n'
    printf '    1. Go to vercel.com → your project → Settings → Git\n'
    printf '    2. Set "Root Directory" to:  src\n'
    printf '    3. Set "Build Command" to:   npm run build\n'
    printf '    4. Set "Output Directory" to: dist\n'
    printf '    5. Set "Install Command" to: npm install\n'
    printf '    6. Connect your GitHub repo (main branch → production)\n'
    printf '\n'
    printf '  Then run: ./scripts/vercel_deploy.sh --deploy\n'
}

deploy() {
    log "Building frontend..."
    cd "$FRONTEND_DIR"

    # Smoke-check: does the build succeed?
    VITE_API_BASE_URL="$VITE_API_BASE_URL" npm run build
    ok "Build succeeded (dist/ is ready)"

    log "Deploying to Vercel (production)..."
    vercel --prod --yes
    ok "Deployed to production"

    log "Verifying deployment..."
    DEPLOY_URL=$(vercel ls --prod 2>/dev/null | grep -E '^https' | head -1 || echo "")
    if [ -n "$DEPLOY_URL" ]; then
        ok "Live at: $DEPLOY_URL"
    fi
}

case "$MODE" in
    --setup)  setup ;;
    --deploy) deploy ;;
    *) err "Unknown mode: $MODE. Use --setup or --deploy" ;;
esac
