# Backend

Django 4.2 REST API serving portfolio data, blog, payments, and more.

## Stack

- **Django 4.2** + **Django REST Framework 3.15**
- **SQLite** (development) / **PostgreSQL** (production via `DATABASE_URL`)
- **Gunicorn** — WSGI server
- **WhiteNoise** — static file serving without a CDN
- **Deployed to Render** via `render.yaml` Blueprint

## Local Setup

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # edit as needed
python manage.py migrate
python manage.py seed_data
python manage.py runserver
```

Or from the repo root:

```bash
./scripts/setup.sh
```

## Environment Variables

See `.env.example` for the full list. Key variables:

| Variable | Required | Description |
|----------|----------|-------------|
| `SECRET_KEY` | ✓ | Django secret key |
| `DEBUG` | | `False` in production |
| `DATABASE_URL` | | PostgreSQL URL (Render injects this automatically) |
| `ALLOWED_HOSTS` | ✓ | Comma-separated hostnames |
| `SITE_URL` | | Full URL for email links and admin references |
| `OPENWEATHER_API_KEY` | | Weather forecast feature |
| `STRIPE_SECRET_KEY` | | Card payment processing |
| `DARAJA_CONSUMER_KEY` | | M-Pesa STK Push (Safaricom Daraja) |
| `EMAIL_HOST_USER` | | Notification emails from contact form |

## API Endpoints

All endpoints are under `/api/`.

| Prefix | Feature |
|--------|---------|
| `/api/health/` | Health check (DB connectivity included) |
| `/api/profile/` | About page data — bio, skills, career |
| `/api/skills/` | Skills list |
| `/api/career/` | Career timeline |
| `/api/weather/` | Weather forecast proxy |
| `/api/projects/` | Portfolio projects and categories |
| `/api/blog/` | Articles, comments, likes, reactions, shares |
| `/api/books/` | Book details and testimonials |
| `/api/music/` | Music tracks |
| `/api/fashion/` | Fashion gallery and categories |
| `/api/great-men-moves/` | GMM programme listings |
| `/api/contact/` | Contact form |
| `/api/newsletter/` | Subscription and past issues |
| `/api/payments/` | M-Pesa STK Push, Stripe PaymentIntents, webhooks |
| `/api/feedback/` | Site feedback widget |

## Testing

```bash
python manage.py test --verbosity=2
# or from the repo root:
./scripts/test.sh --backend-only
```

## Linting

```bash
ruff check . && ruff format --check .
# or from the repo root:
./scripts/lint.sh
```

## Deployment (Render)

Render reads `render.yaml` at the repo root. The build command runs `collectstatic` and `migrate` automatically. Production uses `start_prod.sh` which launches Gunicorn.

Push to the `production` branch to trigger a deploy (via GitHub Actions deploy hook).
