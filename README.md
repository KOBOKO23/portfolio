# Koboko Portfolio

Full-stack personal portfolio for a Kenyan meteorologist, backend developer, data scientist, gospel artist, and author. Built with Django DRF + React (Vite, Tailwind v4).

---

## Project Structure

```
portfolio/
├── backend/                  Django REST API
│   ├── apps/
│   │   ├── blog/             Articles, comments, likes, reactions, shares
│   │   ├── books/            Book info and testimonials
│   │   ├── contact/          Contact form messages
│   │   ├── core/             Profile and skills
│   │   ├── fashion/          Fashion gallery categories & images
│   │   ├── feedback/         Anonymous star-rating feedback widget
│   │   ├── great_men_moves/  GMM mentorship programme
│   │   ├── music/            Music tracks (YouTube links)
│   │   ├── newsletter/       Subscriber management + issue archive
│   │   ├── payments/         M-Pesa (Daraja) + Stripe pre-orders
│   │   └── projects/         Portfolio projects
│   ├── config/
│   │   ├── settings.py       Django settings (dev/prod, S3, security)
│   │   ├── urls.py           Root URL config + robots.txt + sitemap.xml
│   │   └── wsgi.py
│   ├── utils/
│   │   ├── renderers.py      Standard {success, data, error} JSON envelope
│   │   └── pagination.py     Shared page-number pagination (default 20/page)
│   ├── Dockerfile            Python 3.11 slim + gunicorn
│   ├── requirements.txt
│   └── .env.example          All required environment variables documented
│
├── src/                      React frontend (Vite, Tailwind v4)
│   ├── app/
│   │   ├── components/       Reusable UI (Navigation, Footer, SEO, WeatherForecast72Hr…)
│   │   ├── hooks/            useApi, useDebounce, useLocalStorage, useMediaQuery…
│   │   ├── pages/            One file per route (Blog, BlogDetail, Projects, Book…)
│   │   ├── utils/            api.ts, validation.ts, security.ts, performance.ts
│   │   └── types/            Shared TypeScript interfaces
│   ├── test-setup.ts         Vitest global setup (imports @testing-library/jest-dom)
│   ├── vite.config.ts        Build + test config
│   └── package.json
│
├── nginx/
│   └── nginx.conf            Reverse proxy, rate limiting, CSP headers, SPA routing
├── Dockerfile                React multi-stage build → nginx
├── docker-compose.yml        Full stack: postgres + backend + frontend + nginx
└── scripts/
    ├── dev.sh                Local dev: starts backend + frontend in parallel
    ├── aws_deploy.sh         Build → ECR push → ECS force-redeploy
    └── setup.sh              First-time project setup
```

---

## Quick Start (local development)

```bash
# 1. Clone and enter the project
git clone <repo> && cd portfolio

# 2. Run the setup script (creates venv, installs deps, runs migrations, seeds data)
./scripts/setup.sh

# 3. Start both services
./scripts/dev.sh
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:8000/api
- Admin CMS: http://localhost:8000/admin  (login: `admin` / `admin123`)

### Environment

Copy `backend/.env.example` to `backend/.env` and fill in real values for:
- `SECRET_KEY` — generate with `python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"`
- Stripe keys (from https://dashboard.stripe.com/apikeys)
- Daraja keys (from https://developer.safaricom.co.ke)
- AWS keys (if using S3)

---

## API Reference

All endpoints return:
```json
{ "success": true,  "data": <payload>, "error": null }
{ "success": false, "data": null,      "error": { "message": "...", "status": 400, "details": {} } }
```

| Method | URL | Description |
|--------|-----|-------------|
| GET | `/api/blog/categories/` | All blog categories |
| GET | `/api/blog/articles/` | Paginated articles (`?search=`, `?category__slug=`) |
| GET | `/api/blog/articles/<slug>/` | Article detail + view count increment |
| POST | `/api/blog/articles/<slug>/like/` | Toggle like (X-Fingerprint header) |
| POST | `/api/blog/articles/<slug>/react/` | Add/change/remove emoji reaction |
| POST | `/api/blog/articles/<slug>/share/<platform>/` | Increment share counter |
| GET/POST | `/api/blog/articles/<slug>/comments/` | List / create comments |
| GET | `/api/projects/` | All projects |
| GET | `/api/projects/<slug>/` | Project detail |
| GET | `/api/music/tracks/` | Music tracks |
| GET | `/api/books/` | Books |
| POST | `/api/contact/` | Submit contact form |
| POST | `/api/newsletter/subscribe/` | Subscribe / resubscribe |
| GET | `/api/newsletter/issues/` | Newsletter archive |
| POST | `/api/payments/mpesa/stk-push/` | Initiate M-Pesa payment |
| POST | `/api/payments/mpesa/callback/` | Daraja server callback (not for clients) |
| POST | `/api/payments/stripe/create-intent/` | Create Stripe PaymentIntent |
| POST | `/api/payments/stripe/webhook/` | Stripe webhook (not for clients) |
| GET | `/api/payments/orders/<uuid>/` | Poll order status |
| PATCH | `/api/payments/orders/<uuid>/` | Confirm Stripe payment |
| GET | `/robots.txt` | Crawler instructions |
| GET | `/sitemap.xml` | XML sitemap (static pages + live blog articles) |

---

## Tests

### Backend (Django)

```bash
cd backend
source venv/bin/activate
python manage.py test                    # all 92 tests
python manage.py test apps.blog          # single app
python manage.py test --verbosity=2      # verbose
```

Test files:
| File | Coverage |
|------|----------|
| `apps/blog/tests.py` | Models, API: articles, comments, likes, reactions, shares |
| `apps/contact/tests.py` | Contact form model + API |
| `apps/newsletter/tests.py` | Subscribe, resubscription, issue listing |
| `apps/payments/tests.py` | PreOrder model, M-Pesa (mocked), Stripe (mocked) |
| `apps/projects/tests.py` | Project/category models + API |
| `utils/tests.py` | StandardRenderer unit tests + integration |

### Frontend (Vitest)

```bash
cd src
npm test               # run once
npm run test:watch     # watch mode
npm run test:coverage  # with coverage report
```

Test files:
| File | Coverage |
|------|----------|
| `app/utils/validation.test.ts` | All 13 validation/sanitisation functions |
| `app/utils/api.test.ts` | get, post, getCached, clearCache, API_ENDPOINTS |
| `app/hooks/useDebounce.test.ts` | Timing, rapid changes, default delay |
| `app/hooks/useLocalStorage.test.ts` | Read, write, remove, functional updates, fallback |
| `app/components/SEO.test.tsx` | Render without crash for all prop combinations |

---

## Deployment (AWS)

### Prerequisites

1. AWS CLI configured (`aws configure`)
2. ECR repos created for backend and frontend images
3. ECS cluster + task definitions set up
4. RDS PostgreSQL instance running
5. S3 bucket for static/media files

### Deploy

```bash
export AWS_ACCOUNT_ID=123456789012
export AWS_REGION=us-east-1
./scripts/aws_deploy.sh --full          # build + push + migrate + deploy
./scripts/aws_deploy.sh --push-only     # build and push images only
./scripts/aws_deploy.sh --migrate-only  # run Django migrations on ECS
```

### Environment (production)

Set these in ECS task definition or AWS Secrets Manager:
- `DEBUG=False`
- `SECRET_KEY=<strong-random-key>`
- `ALLOWED_HOSTS=koboko.dev,www.koboko.dev`
- `CORS_ALLOWED_ORIGINS=https://koboko.dev,https://www.koboko.dev`
- `DB_ENGINE=postgresql` + `DB_*` vars
- `USE_S3=True` + `AWS_*` vars
- `STRIPE_*` + `DARAJA_*` keys
- `EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend` + SMTP vars

### HTTPS / SSL

Uncomment the HTTP→HTTPS redirect block in `nginx/nginx.conf` and mount your
TLS certificates into `nginx/ssl/`. Use AWS ACM + ALB for managed certificates.

---

## Design System

| Token | Value | Usage |
|-------|-------|-------|
| Gold | `#d4a574` | Accents, CTAs, active states |
| Black | `#0a0a0a` | Hero backgrounds, dark sections |
| Off-white | `#f5f5f0` | Light section backgrounds |
| Serif font | Playfair Display | Headings (`var(--font-serif)`) |
| Sans font | Inter | Body text |

All section backgrounds use pure CSS gradients — no external images required.
Images are uploaded via the CMS (`/admin`) and served from `/media/` (or S3).
