# Philip Oduya — Portfolio

Full-stack personal portfolio — **React 18 + TypeScript + Django REST Framework**.  
Meteorologist · Developer · Mentor · Gospel Artist · Author · Nairobi, Kenya.

Deployed on **Render** (backend) and **Vercel** (frontend).

---

## Architecture

```
portfolio/
├── backend/          Django 4.2 LTS — REST API + Admin CMS
│   ├── apps/
│   │   ├── blog/             Articles, comments, reactions, likes, shares
│   │   ├── books/            Book page, chapters, testimonials, pre-orders
│   │   ├── contact/          Contact form messages
│   │   ├── core/             Profile, skills, weather forecast
│   │   ├── fashion/          Gallery images & categories
│   │   ├── feedback/         Visitor feedback (approval-gated)
│   │   ├── great_men_moves/  Programmes, impact goals, volunteer applications
│   │   ├── music/            Track listing with YouTube/Spotify links
│   │   ├── newsletter/       Subscribers & published issues
│   │   ├── payments/         Stripe + M-Pesa (Daraja) integration
│   │   └── projects/         Portfolio projects + gallery images
│   ├── config/       Django settings, URLs, WSGI
│   └── utils/        Shared renderers, pagination, media helpers
├── src/              React 18 + Vite 6 + Tailwind CSS 4
│   ├── app/
│   │   ├── pages/        One component per route (lazy-loaded chunks)
│   │   ├── components/   Navigation, Footer, FeedbackWidget, SEO, ErrorBoundary
│   │   └── utils/        API helpers, validation, monitoring
│   └── styles/       Global CSS, theme variables, fonts
├── scripts/          Developer tooling
├── docs/             Architecture and process documentation
└── render.yaml       Render Blueprint (infrastructure-as-code)
```

---

## Quick Start

```bash
./scripts/setup.sh    # First-time bootstrap (creates venv, installs deps, migrates)
./scripts/dev.sh      # Start backend + frontend dev servers in parallel
```

## Scripts

| Script | Purpose |
|--------|---------|
| `scripts/setup.sh` | Bootstrap dev environment after cloning |
| `scripts/dev.sh` | Start both servers in parallel |
| `scripts/test.sh` | Run backend and frontend test suites |
| `scripts/lint.sh` | Run ruff, ESLint, TypeScript, and Prettier |
| `scripts/migrate.sh` | Run Django migrations with a pending-check first |
| `scripts/deploy-check.sh` | Pre-deploy validation gate |
| `scripts/createsuperuser.sh` | Non-interactive Django superuser creation |
| `scripts/backup.sh` | Database and media backup |
| `scripts/pg_switch.sh` | Migrate local data from SQLite → PostgreSQL |

---

## Tech Stack

| Layer | Technologies |
|-------|-------------|
| Backend | Python 3.11, Django 4.2, DRF, Gunicorn, WhiteNoise |
| Frontend | React 18, TypeScript, Vite 6, Tailwind CSS 4, Framer Motion |
| Database | SQLite (dev) · PostgreSQL (prod via Render) |
| Payments | Stripe (international card) + Safaricom Daraja M-Pesa |
| 3rd party | OpenWeatherMap API |

---

## API Reference

All API endpoints are under `/api/`.

### Core
| Method | Endpoint | Notes |
|--------|----------|-------|
| `GET` | `/api/health/` | Health check with DB connectivity |
| `GET` | `/api/profile/` | Profile & social links |
| `GET` | `/api/skills/` | Skills grouped by category |
| `GET` | `/api/career/` | Career timeline |
| `GET` | `/api/weather/forecast/` | 72-hour Nairobi forecast |

### Blog
| Method | Endpoint | Notes |
|--------|----------|-------|
| `GET` | `/api/blog/articles/` | `?search=` `?category__slug=` `?is_featured=` |
| `GET` | `/api/blog/articles/:slug/` | Full detail including content_html |
| `GET/POST` | `/api/blog/articles/:slug/comments/` | List approved; POST to create |
| `POST` | `/api/blog/articles/:slug/like/` | Toggle — pass `X-Fingerprint` header |
| `POST` | `/api/blog/articles/:slug/react/` | Body: `{"reaction":"fire"}` |
| `POST` | `/api/blog/articles/:slug/share/:platform/` | twitter / facebook / linkedin / whatsapp |
| `GET` | `/api/blog/categories/` | All categories |

### Projects · Fashion · Music · Books · GMM · Newsletter · Contact · Payments · Feedback
See the individual `urls.py` in each `backend/apps/*/` directory.

---

## Security

- HTTPS enforced via `SECURE_PROXY_SSL_HEADER` (Render SSL termination pattern)
- HSTS 1 year + preload in production
- All Django security headers: XSS filter, content-type nosniff, X-Frame-Options, referrer policy
- CORS restricted to listed origins in production
- Rate limiting: 5/hr contact & newsletter; 200/hr anonymous API
- All secrets via environment variables — no credentials in source code

---

## Deployment

See [backend/README.md](backend/README.md) and [src/README.md](src/README.md) for environment variables and deploy steps.

Branch workflow: [docs/branch-strategy.md](docs/branch-strategy.md)
