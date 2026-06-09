# Go-Live Checklist — Koboko Portfolio

> Reference this document every time you deploy to production.  
> Work top-to-bottom. Do not skip a section.

---

## 1. Mandatory — App Won't Work Without These

### 1.1 Fill in `backend/.env` with real values

```bash
# Generate a real secret key (run once, copy the output)
python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
```

| Variable | What to set |
|----------|-------------|
| `SECRET_KEY` | Output of command above — never reuse the dev default |
| `DEBUG` | `False` |
| `ALLOWED_HOSTS` | `koboko.dev,www.koboko.dev` (your real domain) |
| `CORS_ALLOWED_ORIGINS` | `https://koboko.dev,https://www.koboko.dev` |
| `CSRF_TRUSTED_ORIGINS` | `https://koboko.dev,https://www.koboko.dev` |
| `SITE_URL` | `https://koboko.dev` |

### 1.2 Payment API Keys

| Variable | Where to get it |
|----------|----------------|
| `STRIPE_PUBLISHABLE_KEY` | dashboard.stripe.com → Developers → API keys → **Live** publishable key (`pk_live_…`) |
| `STRIPE_SECRET_KEY` | Same page → **Live** secret key (`sk_live_…`) |
| `STRIPE_WEBHOOK_SECRET` | dashboard.stripe.com → Developers → Webhooks → add endpoint → copy signing secret |
| `DARAJA_CONSUMER_KEY` | developer.safaricom.co.ke → My Apps → **Production** app |
| `DARAJA_CONSUMER_SECRET` | Same app |
| `DARAJA_ENV` | `production` |
| `DARAJA_CALLBACK_URL` | `https://api.koboko.dev/api/payments/mpesa/callback/` |

> **Stripe webhook endpoint to register:** `https://api.koboko.dev/api/payments/stripe/webhook/`  
> **Events to listen for:** `payment_intent.succeeded`, `payment_intent.payment_failed`

### 1.3 Database — Switch from SQLite to PostgreSQL

```bash
# Create the database
createdb koboko_prod

# Add to .env
DB_ENGINE=postgresql
DB_NAME=koboko_prod
DB_USER=koboko
DB_PASSWORD=your_db_password
DB_HOST=localhost
DB_PORT=5432
```

Then run migrations:
```bash
python manage.py migrate
python manage.py createsuperuser
```

### 1.4 Create the Profile record

Visit `https://koboko.dev/admin/core/profile/` and fill in:

- Full name, tagline, bio
- **Email** — appears on the Contact page and Footer
- **Phone** — appears on the Contact page
- **Location** — appears on the Contact page
- LinkedIn, GitHub, Twitter, Instagram URLs — appear in Footer and Contact
- Years experience, projects completed

Without a Profile record: Contact page shows no email/phone, Footer shows no social links.

---

## 2. Media Storage — Switch to AWS S3

Local disk is not persistent on most cloud servers. Enable S3:

```bash
USE_S3=True
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret
AWS_STORAGE_BUCKET_NAME=koboko-portfolio
AWS_S3_REGION_NAME=af-south-1        # or us-east-1
```

**S3 bucket policy** — make media publicly readable:
```json
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": "*",
    "Action": "s3:GetObject",
    "Resource": "arn:aws:s3:::koboko-portfolio/*"
  }]
}
```

---

## 3. Seed Content — Admin Must-Haves Before Launch

Log into `/admin` and add at minimum:

| Section | Minimum to add |
|---------|---------------|
| **Core → Profile** | 1 record (see 1.4 above) |
| **Core → Skills** | 5–10 skills with categories and proficiency |
| **Core → Career Events** | Your career timeline entries |
| **Projects** | 3–5 projects with descriptions and images |
| **Blog → Articles** | 2–3 published articles |
| **Books** | 1 book record (Broken Souls) with price, description, chapters |
| **Great Men Moves → Impact Goals** | 3–4 goals with numbers and progress |
| **Music → Tracks** | Any gospel tracks with YouTube links |

Without content, pages render empty states — technically correct but looks unfinished.

---

## 4. Frontend Build & Deployment

```bash
cd src

# Set the production API URL
echo "VITE_API_BASE_URL=https://api.koboko.dev/api" > .env.production

# Build
npm run build

# Output: src/dist/  ← serve this folder
```

Deploy `src/dist/` to any static host:
- **Netlify / Vercel** — drag and drop `dist/`, set env var, done
- **AWS S3 + CloudFront** — `aws s3 sync dist/ s3://koboko-portfolio-frontend`
- **Nginx** — `root /var/www/koboko/dist;` with `try_files $uri /index.html;`

---

## 5. Backend Deployment

```bash
cd backend

# Production start
./start_prod.sh

# What it does:
#   python manage.py migrate
#   python manage.py collectstatic --no-input
#   gunicorn config.wsgi:application --bind 0.0.0.0:$PORT --workers 3
```

**Nginx reverse-proxy config (if self-hosting):**
```nginx
server {
    listen 443 ssl;
    server_name api.koboko.dev;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /media/ {
        # Only needed if NOT using S3
        alias /var/www/koboko/media/;
    }
}
```

---

## 6. Optional — Weather API

```bash
OPENWEATHER_API_KEY=your_key          # openweathermap.org — free tier is enough
DEFAULT_WEATHER_CITY=Nairobi,KE
DEFAULT_WEATHER_LAT=-1.286389
DEFAULT_WEATHER_LON=36.817223
```

Without a key: the weather page shows mock data (clearly labelled). Not critical for launch.

---

## 7. Optional — Email Notifications

To receive an email when someone submits the contact form or volunteer application:

```bash
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=kobokophilip@gmail.com
EMAIL_HOST_PASSWORD=your_app_password   # Gmail App Password, not your login password
DEFAULT_FROM_EMAIL=kobokophilip@gmail.com
ADMIN_EMAIL=kobokophilip@gmail.com
```

Without this: submissions still save to the database (visible in admin). You just won't get live email alerts.

---

## 8. Pre-Launch Verification Checklist

Run through this manually after deploying:

- [ ] `https://koboko.dev` loads — no console errors
- [ ] `https://koboko.dev/admin` accessible — login works
- [ ] Profile record exists — Footer shows real social links
- [ ] Contact form sends a message — appears in admin under **Contact → Messages**
- [ ] Pre-order flow: enter test card `4242 4242 4242 4242` (Visa, any future date/CVV) — order appears in admin under **Payments → Pre-Orders**
- [ ] M-Pesa test: enter your real number in sandbox mode and confirm STK push arrives
- [ ] Newsletter subscribe works — subscriber appears in **Newsletter → Subscribers**
- [ ] Volunteer form on GMM page submits — application appears in **Great Men Moves → Volunteer Applications**
- [ ] `https://koboko.dev/sitemap.xml` returns XML with blog articles listed
- [ ] `https://koboko.dev/robots.txt` returns correct content
- [ ] All pages load without blank/empty sections (content seeded in step 3)

---

## 9. Test Results (as of last sweep)

| Suite | Tests | Result |
|-------|-------|--------|
| Backend (Django) | 92 | ✅ All pass |
| Frontend (Vitest) | 61 | ✅ All pass |
| **Total** | **153** | ✅ |

Run before every deployment:
```bash
# Backend
cd backend && source venv/bin/activate && python manage.py test

# Frontend
cd src && npm test
```

---

## 10. Documentation & Code Quality Assessment

### What's excellent
- **README.md** — full architecture diagram, quick-start, all env vars documented, full API reference, admin guide, tech stack, security notes, roadmap
- **API design** — every endpoint returns `{success, data, error}` via `StandardRenderer` — consistent, predictable, frontend-friendly
- **Django admin** — every model registered, inline editing, search, filters — no-code content management for all sections
- **Backend tests** — 92 tests covering models, API endpoints, validation, payment mocks, error paths
- **Frontend tests** — 61 tests covering API utility, caching, validation, hooks, SEO component
- **Security** — HSTS, CORS, XSS headers, rate limiting, secret key validation on boot, no credentials in source

### What's missing / to improve before launch
- **No tests** for: core (Profile, Skill, CareerEvent), fashion, music, great_men_moves, feedback apps — backend endpoints are live but untested
- **No frontend component tests** for page components (Book, Contact, GreatMenMoves) — only utility-level tests exist
- **No E2E tests** (Playwright/Cypress) — full user flows like the Visa checkout are untested end-to-end
- ~~**Email notification code** not yet implemented~~ ✅ Done — contact + volunteer forms send email alert to `ADMIN_EMAIL`; set `ADMIN_EMAIL=kobokophilip@gmail.com` in `.env`
- ~~**Blog/Projects** silently swallow fetch errors~~ ✅ Done — Blog shows retry banner; Projects shows "sample data" notice on API failure

### Verdict
**Documentation: 9/10** — README is genuinely comprehensive. Any developer can onboard without asking questions.  
**Tests: 6/10** — Good foundation and 100% pass rate, but coverage is patchy. Critical apps (payments, blog, contact) are tested. Most others are not. Sufficient for a personal portfolio; needs work before a team project.

---

## Quick Reference — Key URLs After Deployment

| URL | Purpose |
|-----|---------|
| `https://koboko.dev` | Public site |
| `https://koboko.dev/admin` | Django admin CMS |
| `https://koboko.dev/sitemap.xml` | SEO sitemap |
| `https://koboko.dev/robots.txt` | Search engine rules |
| `https://api.koboko.dev/api/payments/mpesa/callback/` | Daraja webhook |
| `https://api.koboko.dev/api/payments/stripe/webhook/` | Stripe webhook |
