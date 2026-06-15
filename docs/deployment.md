# Deployment Guide

This document covers deploying to the production stack: **Render** (backend) and **Vercel** (frontend).

---

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [First-Time Deployment](#first-time-deployment)
- [Backend — Render](#backend--render)
- [Frontend — Vercel](#frontend--vercel)
- [DNS Configuration](#dns-configuration)
- [GitHub Actions Setup](#github-actions-setup)
- [Post-Deploy Checklist](#post-deploy-checklist)
- [Routine Deployments](#routine-deployments)
- [Rollback Procedure](#rollback-procedure)
- [Environment Variables Reference](#environment-variables-reference)

---

## Architecture Overview

```
GitHub (production branch push)
  │
  ├── GitHub Actions → Render deploy hook  → Render (Django + PostgreSQL)
  │                                           api.koboko.dev
  │
  └── GitHub Actions → Vercel CLI          → Vercel CDN (React SPA)
                                             koboko.dev
```

Render reads `render.yaml` from the repo root to provision the web service and PostgreSQL database. Vercel deploys the `src/dist/` build output.

---

## First-Time Deployment

### Step 1 — Render (backend)

1. Create a Render account at [render.com](https://render.com).
2. Connect your GitHub repository.
3. In the Render dashboard, click **New → Blueprint** and select this repository.  
   Render reads `render.yaml` and provisions:
   - A **web service** running Django + Gunicorn
   - A **PostgreSQL** database (auto-injects `DATABASE_URL`)
4. In the web service settings, add the environment variables from [Environment Variables Reference](#environment-variables-reference).
5. Find the deploy hook URL under **Settings → Deploy Hook** and copy it — you will need it for GitHub Actions.
6. Find the public URL (e.g. `https://koboko-portfolio.onrender.com`) — this is your `BACKEND_URL`.

### Step 2 — Vercel (frontend)

1. Create a Vercel account at [vercel.com](https://vercel.com).
2. Click **Add New → Project** and import the GitHub repository.
3. Set the **Root Directory** to `src`.
4. Set the **Build Command** to `npm run build`.
5. Set the **Output Directory** to `dist`.
6. Add the environment variables:
   - `VITE_API_BASE_URL` = your backend URL + `/api` (e.g. `https://api.koboko.dev/api`)
   - `VITE_SITE_URL` = your frontend domain (e.g. `https://koboko.dev`)
   - `VITE_GITHUB_URL`, `VITE_TWITTER_HANDLE`, `VITE_STRIPE_PUBLISHABLE_KEY`
7. Deploy. Vercel gives you a preview URL immediately.
8. Note your **Org ID** and **Project ID** from the Vercel project settings.

### Step 3 — Custom domain (optional)

1. In Render, go to the web service → **Settings → Custom Domains** → add `api.koboko.dev`.
2. In Vercel, go to **Project → Domains** → add `koboko.dev`.
3. Add the DNS records your registrar requires (CNAME or A records).

### Step 4 — Seed content

Log in to `https://api.koboko.dev/admin` and create the minimum content:

| Section | Minimum |
|---------|---------|
| **Core → Profile** | 1 record (name, bio, social links, email) |
| **Core → Skills** | 5–10 skills |
| **Core → Career Events** | Career timeline entries |
| **Projects** | 3–5 projects with images |
| **Blog → Articles** | 2–3 published articles |
| **Books** | 1 book record with price and description |
| **Great Men Moves → Impact Goals** | 3–4 goals with progress |
| **Music → Tracks** | Any tracks with YouTube links |

---

## Backend — Render

### Build command (set in render.yaml)

```bash
pip install -r requirements.txt && \
python manage.py collectstatic --no-input && \
python manage.py migrate
```

### Start command

```bash
./start_prod.sh
```

`start_prod.sh` launches Gunicorn:

```bash
gunicorn config.wsgi:application \
  --bind "0.0.0.0:${PORT:-8000}" \
  --workers "${GUNICORN_WORKERS:-4}" \
  --timeout 120
```

### Health check

Render polls `/api/health/` every 30 seconds. It expects a `200` response. If the database is unreachable, the endpoint returns `503` and Render marks the service as unhealthy.

### Static files

WhiteNoise serves `staticfiles/` at `/static/` directly from Gunicorn — no separate Nginx required.

### Media files

Media uploads are stored on a **Render Disk** mounted at `/media/`. The disk persists across deploys and restarts.

> **Note:** Render Disks are not replicated. For high-availability or large media libraries, configure S3 by setting `USE_S3=True` and the `AWS_*` variables. See the Environment Variables Reference below.

---

## Frontend — Vercel

Vercel builds the project automatically when the `production` branch is pushed. The build runs:

```bash
cd src
npm ci
npm run build
```

The `dist/` folder is deployed to Vercel's CDN. All routes return `index.html` (SPA routing) thanks to Vercel's automatic fallback routing.

### Updating environment variables in Vercel

1. Vercel dashboard → Project → Settings → Environment Variables.
2. Update the value and redeploy.

---

## DNS Configuration

| Record | Type | Value | Purpose |
|--------|------|-------|---------|
| `koboko.dev` | A / CNAME | Vercel | Root domain → frontend |
| `www.koboko.dev` | CNAME | Vercel | www redirect |
| `api.koboko.dev` | CNAME | Render | API subdomain → backend |

---

## GitHub Actions Setup

The `deploy-production.yml` workflow requires the following GitHub repository secrets. Add them at **Settings → Secrets and variables → Actions**.

| Secret | Value |
|--------|-------|
| `RENDER_DEPLOY_HOOK_URL` | Render deploy hook URL from web service settings |
| `BACKEND_URL` | `https://api.koboko.dev` (no trailing slash) |
| `VERCEL_TOKEN` | Vercel personal access token |
| `VERCEL_ORG_ID` | From Vercel project settings |
| `VERCEL_PROJECT_ID` | From Vercel project settings |
| `VITE_API_BASE_URL` | `https://api.koboko.dev/api` |
| `VITE_SITE_URL` | `https://koboko.dev` |
| `VITE_GITHUB_URL` | GitHub profile URL |
| `VITE_TWITTER_HANDLE` | Twitter handle (no @) |
| `VITE_STRIPE_PUBLISHABLE_KEY` | Stripe live publishable key |

Also create a **GitHub Environment** named `production` (Settings → Environments) and add these secrets there — the workflow uses `environment: production` to require manual approval before deploying.

---

## Post-Deploy Checklist

Run through this after every production deployment:

**Application**
- [ ] `https://koboko.dev` loads — no console errors
- [ ] `https://api.koboko.dev/api/health/` returns `{"status": "ok", "db": true}`
- [ ] `https://koboko.dev/admin` — login works

**Key user journeys**
- [ ] Contact form submits — message appears in admin under **Contact → Messages**
- [ ] Newsletter subscribe — subscriber appears under **Newsletter → Subscribers**
- [ ] Blog like/reaction works (toggle on/off)
- [ ] Volunteer form submits — application appears under **Great Men Moves → Volunteer Applications**

**Payments (if applicable)**
- [ ] Stripe test card `4242 4242 4242 4242` (any future date/CVV) — order appears in **Payments → Pre-Orders** with `status=paid`
- [ ] M-Pesa sandbox: enter real phone in sandbox mode — STK push arrives on device
- [ ] Stripe webhook endpoint registered in dashboard for `payment_intent.succeeded` and `payment_intent.payment_failed`

**Infrastructure**
- [ ] Render service shows "Live" (green)
- [ ] Vercel deployment shows "Ready"
- [ ] Custom domains resolve correctly
- [ ] SSL certificates valid (green padlock in browser)

---

## Routine Deployments

Deployments happen automatically when `production` branch is pushed:

```bash
# Standard flow from development to production
git checkout development
git pull origin development

# ... make changes, open PRs, merge to development, then to test, then to main ...

git checkout main
git pull origin main
git checkout production
git merge --ff-only main
git push origin production
```

GitHub Actions fires `deploy-production.yml`, which:
1. Calls the Render deploy hook
2. Polls `/api/health/` until `status=ok` (5-minute timeout)
3. Builds the frontend and deploys to Vercel

Both jobs run in parallel. If either fails, the workflow fails and you get a GitHub notification.

---

## Rollback Procedure

### Backend rollback (Render)

Render keeps a deployment history. To roll back:

1. Render dashboard → Web Service → **Deploys**
2. Click the previous deploy → **Rollback to this deploy**

Or to roll back via git:

```bash
git revert <commit-sha>
git push origin production
```

### Frontend rollback (Vercel)

1. Vercel dashboard → Project → **Deployments**
2. Find the previous deployment → **...** menu → **Promote to Production**

---

## Environment Variables Reference

### Backend (Render or `backend/.env`)

| Variable | Required | Example | Description |
|----------|----------|---------|-------------|
| `SECRET_KEY` | **Yes** | `django-insecure-...` | Django secret key — generate with `python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"` |
| `DEBUG` | No | `False` | Must be `False` in production |
| `ALLOWED_HOSTS` | **Yes** | `api.koboko.dev,koboko.dev` | Comma-separated allowed hostnames |
| `CORS_ALLOWED_ORIGINS` | **Yes** | `https://koboko.dev` | Comma-separated CORS origins |
| `CSRF_TRUSTED_ORIGINS` | **Yes** | `https://api.koboko.dev` | Comma-separated trusted origins |
| `DATABASE_URL` | **Yes** (prod) | `postgresql://user:pass@host/db` | Injected automatically by Render |
| `SITE_URL` | **Yes** | `https://koboko.dev` | Used in email links and admin references |
| `OPENWEATHER_API_KEY` | No | `abc123` | Weather forecast feature |
| `DEFAULT_WEATHER_CITY` | No | `Nairobi,KE` | Default city for weather |
| `STRIPE_PUBLISHABLE_KEY` | Payments | `pk_live_...` | Stripe frontend key |
| `STRIPE_SECRET_KEY` | Payments | `sk_live_...` | Stripe server-side key |
| `STRIPE_WEBHOOK_SECRET` | Payments | `whsec_...` | Stripe webhook signature secret |
| `DARAJA_CONSUMER_KEY` | M-Pesa | — | Safaricom Daraja API app key |
| `DARAJA_CONSUMER_SECRET` | M-Pesa | — | Safaricom Daraja API app secret |
| `DARAJA_ENV` | M-Pesa | `production` | `sandbox` or `production` |
| `DARAJA_CALLBACK_URL` | M-Pesa | `https://api.koboko.dev/api/payments/mpesa/callback/` | Daraja callback endpoint |
| `DARAJA_SHORTCODE` | M-Pesa | `174379` | Business shortcode |
| `DARAJA_PASSKEY` | M-Pesa | — | Daraja online passkey |
| `EMAIL_BACKEND` | Emails | `django.core.mail.backends.smtp.EmailBackend` | Email backend |
| `EMAIL_HOST` | Emails | `smtp.gmail.com` | SMTP host |
| `EMAIL_PORT` | Emails | `587` | SMTP port |
| `EMAIL_USE_TLS` | Emails | `True` | Use STARTTLS |
| `EMAIL_HOST_USER` | Emails | `kobokophilip@gmail.com` | SMTP username |
| `EMAIL_HOST_PASSWORD` | Emails | — | Gmail App Password |
| `DEFAULT_FROM_EMAIL` | Emails | `kobokophilip@gmail.com` | From address |
| `ADMIN_EMAIL` | Emails | `kobokophilip@gmail.com` | Notification recipient |
| `USE_S3` | Media | `True` | Enable S3 media storage |
| `AWS_ACCESS_KEY_ID` | S3 | — | AWS IAM access key |
| `AWS_SECRET_ACCESS_KEY` | S3 | — | AWS IAM secret key |
| `AWS_STORAGE_BUCKET_NAME` | S3 | `koboko-portfolio` | S3 bucket name |
| `AWS_S3_REGION_NAME` | S3 | `af-south-1` | S3 bucket region |
| `GUNICORN_WORKERS` | No | `4` | Number of Gunicorn worker processes |

### Frontend (Vercel or `src/.env`)

| Variable | Required | Example | Description |
|----------|----------|---------|-------------|
| `VITE_API_BASE_URL` | **Yes** | `https://api.koboko.dev/api` | Django API root (no trailing slash) |
| `VITE_SITE_URL` | No | `https://koboko.dev` | Canonical site URL for OG tags |
| `VITE_GITHUB_URL` | No | `https://github.com/KOBOKO23` | GitHub profile link |
| `VITE_TWITTER_HANDLE` | No | `kobokophilip` | Twitter handle (no @) |
| `VITE_STRIPE_PUBLISHABLE_KEY` | Payments | `pk_live_...` | Stripe frontend publishable key |

### Stripe webhook registration

Register the webhook endpoint in the Stripe dashboard:

- **Endpoint URL:** `https://api.koboko.dev/api/payments/stripe/webhook/`
- **Events to listen for:**
  - `payment_intent.succeeded`
  - `payment_intent.payment_failed`
