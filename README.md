# Koboko Portfolio

Full-stack personal portfolio — **React 18 + Django REST Framework**.  
Meteorologist · Backend Developer · Mentor · Gospel Artist · Author · Nairobi, Kenya.

---

## Architecture

```
portfolio/
├── backend/          Django 4.2 LTS — REST API + Admin CMS
│   ├── apps/
│   │   ├── blog/             Articles, comments, reactions, likes, shares
│   │   ├── books/            Book page, chapters, testimonials, pre-orders
│   │   ├── contact/          Contact form messages
│   │   ├── core/             Profile, Skills
│   │   ├── fashion/          Gallery images & categories
│   │   ├── feedback/         Visitor feedback (approval-gated)
│   │   ├── great_men_moves/  Programs, impact goals, volunteer applications
│   │   ├── music/            Track listing with YouTube links
│   │   ├── newsletter/       Subscribers & published issues
│   │   ├── payments/         Stripe + M-Pesa (Daraja) integration
│   │   └── projects/         Portfolio projects + gallery images
│   ├── config/       Django settings, URLs, WSGI
│   └── utils/        Shared renderers, pagination, media helpers (S3-aware)
└── src/              React 18 + Vite 6 + Tailwind CSS 4
    ├── app/
    │   ├── pages/        One component per route (lazy-loaded chunks)
    │   ├── components/   Navigation, Footer, FeedbackWidget, SEO, ErrorBoundary
    │   └── utils/        API helpers, validation, monitoring
    └── styles/       Global CSS, theme variables, fonts
```

---

## Quick Start — Development

### Backend

```bash
cd backend
cp .env.example .env         # fill in required vars (see below)
./start.sh                   # creates venv, installs deps, migrates, runs dev server
# → http://localhost:8000/admin

python manage.py createsuperuser   # create your admin account
```

### Frontend

```bash
cd src
npm install
# create .env.local with:
echo "VITE_API_BASE_URL=http://localhost:8000/api" > .env.local
npm run dev
# → http://localhost:5173
```

---

## Environment Variables

### Backend — `backend/.env`

| Variable | Required | Description |
|----------|:--------:|-------------|
| `SECRET_KEY` | **prod** | Django secret — generate: `python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"` |
| `DEBUG` | no | `True` dev / `False` prod |
| `ALLOWED_HOSTS` | **prod** | Comma-list: `koboko.dev,www.koboko.dev` |
| `CORS_ALLOWED_ORIGINS` | no | Comma-list of frontend origins |
| `SITE_URL` | no | Public site URL e.g. `https://koboko.dev` |
| `DB_ENGINE` | no | `postgresql` prod, `sqlite` dev (default) |
| `DB_NAME` / `DB_USER` / `DB_PASSWORD` / `DB_HOST` / `DB_PORT` | prod | PostgreSQL connection |
| `USE_S3` | no | `True` to use AWS S3 for all media |
| `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` | S3 | AWS IAM credentials |
| `AWS_STORAGE_BUCKET_NAME` | S3 | e.g. `koboko-portfolio` |
| `AWS_S3_REGION_NAME` | S3 | e.g. `af-south-1` |
| `STRIPE_PUBLISHABLE_KEY` / `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` | payments | Stripe dashboard |
| `DARAJA_CONSUMER_KEY` / `DARAJA_CONSUMER_SECRET` | M-Pesa | Safaricom Daraja API |
| `DARAJA_ENV` | M-Pesa | `sandbox` or `production` |
| `OPENWEATHER_API_KEY` | weather | OpenWeatherMap |
| `EMAIL_BACKEND` | no | `django.core.mail.backends.smtp.EmailBackend` for prod |

### Frontend — `src/.env.local`

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_API_BASE_URL` | `http://localhost:8000/api` | Backend API root |

---

## Production Deployment

### Backend (gunicorn)

```bash
cd backend
export DEBUG=False
export SECRET_KEY=your-real-secret
export ALLOWED_HOSTS=koboko.dev,api.koboko.dev
export DB_ENGINE=postgresql
# ... other env vars
./start_prod.sh
# Runs: migrate → collectstatic → gunicorn on $PORT (default 8000)
```

### Frontend (static build)

```bash
cd src
VITE_API_BASE_URL=https://api.koboko.dev/api npm run build
# Serve dist/ with Nginx, S3 + CloudFront, or Netlify/Vercel
```

### Recommended stack

```
Nginx (reverse proxy)
├── / → S3/CloudFront (React build)
└── /api/ → gunicorn (Django)
         ↓
      PostgreSQL + S3 media
```

---

## API Reference

All endpoints return `{ "success": bool, "data": any, "error": any }`.

### Core
| Method | Endpoint | Notes |
|--------|----------|-------|
| `GET` | `/api/profile/` | Profile & social links |
| `GET` | `/api/skills/` | Skills grouped by category |
| `GET` | `/api/weather/forecast/` | 72-hour Nairobi forecast |

### Blog
| Method | Endpoint | Notes |
|--------|----------|-------|
| `GET` | `/api/blog/articles/` | `?search=` `?category__slug=` `?is_featured=` |
| `GET` | `/api/blog/articles/:slug/` | Full detail incl. content_html |
| `GET` | `/api/blog/articles/:slug/comments/` | Approved comments |
| `POST` | `/api/blog/articles/:slug/comments/` | `author_name`, `author_email`, `content` |
| `POST` | `/api/blog/articles/:slug/like/` | Header: `X-Fingerprint` |
| `POST` | `/api/blog/articles/:slug/react/` | Body: `{"reaction":"fire"}` |
| `POST` | `/api/blog/articles/:slug/share/:platform/` | platforms: twitter facebook linkedin whatsapp copy_link |
| `GET` | `/api/blog/categories/` | All categories |

### Projects
| `GET` | `/api/projects/` | `?is_featured=` `?year=` |
| `GET` | `/api/projects/:slug/` | Detail + gallery images |

### Fashion
| `GET` | `/api/fashion/images/` | `?category__slug=` |
| `GET` | `/api/fashion/categories/` | |

### Music · Books · Great Men Moves · Newsletter · Contact · Feedback · Payments
See [backend/apps/*/urls.py](backend/apps/) for the full list.

---

## Admin CMS Guide

Visit `/admin/` with your superuser account.

| Section | What to manage |
|---------|---------------|
| **Blog → Articles** | Write & publish (Markdown). Images inline. Comments moderation. |
| **Blog → Comments** | Approve / reject reader comments. |
| **Projects** | Add projects, upload gallery images, paste GitHub/live URLs. |
| **Fashion → Images** | Upload photos, assign categories and captions. |
| **Music → Tracks** | Add YouTube URL → embedded player activates automatically. |
| **Books** | Chapter previews, Author's Note, testimonials, pricing, publish flag. |
| **Great Men Moves** | Programs, impact goals (number + progress %), volunteer applications. |
| **Newsletter** | View subscribers, publish issues. |
| **Contact** | Read and triage incoming messages. |
| **Feedback** | Approve testimonials to display publicly on the site. |
| **Core → Skills** | Set skill name, category, proficiency (0–100). |
| **Core → Profile** | Name, bio, social links — reflected live across the site. |

---

## Tech Stack

| Layer | Technologies |
|-------|-------------|
| **Backend** | Python 3.11, Django 4.2 LTS, DRF, Jazzmin, django-cors-headers, django-filter, Stripe SDK, boto3, Pillow, Markdown, bleach, gunicorn |
| **Frontend** | React 18, TypeScript, Vite 6, Tailwind CSS 4, Framer Motion, React Router 7, Lucide React, Stripe.js |
| **Database** | SQLite (dev) · PostgreSQL (prod) |
| **Media** | Local filesystem (dev) · AWS S3 (prod) |
| **Payments** | Stripe (international card) + Safaricom Daraja M-Pesa (Kenya) |
| **3rd party** | OpenWeatherMap API, Google Fonts |

---

## Security

- HTTPS enforced in production (HSTS 1 year + preload)
- All Django security headers: XSS filter, content-type nosniff, X-Frame-Options DENY, referrer policy
- CORS restricted to listed origins in production
- Rate limiting: 5/hr contact & newsletter, 200/hr anonymous API
- `SECRET_KEY` validation on startup — app refuses to boot with dev key in production
- `USE_S3=True` → all media goes to S3; local disk has no user-uploaded content in prod
- SQL injection protected by Django ORM throughout
- No credentials in source code — all via environment variables

---

## Roadmap

- [ ] Email notifications to admin on new contact messages / volunteer applications
- [ ] Blog article scheduling (publish at future date)
- [ ] i18n — Swahili language support (backend model already has `language` field)
- [ ] PWA manifest + service worker for offline reading
- [ ] Search page with full-text across blog + projects
- [ ] Admin email reply action for contact messages
