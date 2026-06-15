# Architecture

## System Overview

This is a full-stack personal portfolio. The backend is a Django REST API deployed to Render; the frontend is a React single-page application deployed to Vercel. They communicate exclusively over HTTPS.

```
┌─────────────────────────────────────────────────────────────────┐
│                          Client (Browser)                        │
└────────────────────┬───────────────────────┬────────────────────┘
                     │ HTTPS                 │ HTTPS
                     ▼                       ▼
          ┌─────────────────┐     ┌─────────────────────┐
          │  Vercel CDN     │     │  Render             │
          │  (React SPA)    │     │  (Django + Gunicorn) │
          │  koboko.dev     │◄────┤  api.koboko.dev      │
          └─────────────────┘     └────────┬────────────┘
                                           │
                               ┌───────────┴───────────┐
                               │                       │
                       ┌───────▼──────┐     ┌─────────▼──────┐
                       │  PostgreSQL  │     │  Render Disk   │
                       │  (Render)    │     │  (media files) │
                       └──────────────┘     └────────────────┘
```

---

## Component Responsibilities

### Frontend — React SPA (`src/`)

| Directory | Purpose |
|-----------|---------|
| `app/pages/` | One component per route; lazy-loaded via React Router `createBrowserRouter` |
| `app/components/` | Shared UI: `Navigation`, `Footer`, `SEO`, `FeedbackWidget`, `ErrorBoundary` |
| `app/utils/` | API client helpers, form validation, monitoring utilities |
| `styles/` | Global CSS, Tailwind theme overrides, Google Fonts declarations |
| `public/` | Static assets served at root: favicon, `site.webmanifest`, OG image |

**Key design decisions:**
- Every page is a separate Vite chunk (lazy import) — cold cache LCP is unaffected by JavaScript for unvisited routes.
- The `@` alias resolves to `src/app/` so imports never need relative `../../` traversal.
- `react-helmet-async` provides per-page `<head>` management for SEO without a server.

### Backend — Django API (`backend/`)

| Directory | Purpose |
|-----------|---------|
| `apps/` | 11 feature apps; each owns its models, views, serializers, URLs, and admin |
| `config/` | `settings.py`, `urls.py`, `wsgi.py`; all environment-driven configuration |
| `utils/` | `media.py` (absolute media URL helper), `pagination.py`, `renderers.py` |

**Request lifecycle:**

```
Request
  → Gunicorn (WSGI)
  → Django middleware stack
      SecurityMiddleware  ← adds security headers
      WhiteNoiseMiddleware ← serves static files (CSS/JS/admin)
      CorsMiddleware ← validates Origin header
      ThrottleMiddleware ← rate limiting
  → URL router → DRF view → serializer → model → database
  → Response (JSON via StandardRenderer)
```

**Response envelope:**  
All API responses use a custom `StandardRenderer` that wraps data in:
```json
{ "success": true, "data": { ... } }
{ "success": false, "error": { "message": "..." } }
```

---

## Data Model Summary

```
core           Profile, Skill, CareerEvent
blog           BlogCategory, BlogArticle, BlogImage, BlogComment,
               BlogLike, BlogReaction, BlogShareCount
projects       ProjectCategory, Project, ProjectImage
books          Book, BookChapter, BookTestimonial
music          MusicTrack
fashion        FashionCategory, FashionImage
newsletter     NewsletterSubscriber, NewsletterIssue
contact        ContactMessage
feedback       Feedback
great_men_moves GreatMenProgram, ImpactGoal, VolunteerApplication
payments       PreOrder
```

---

## Key Data Flows

### Contact form submission

```
Browser  POST /api/contact/messages/
  → ContactRateThrottle (5/hr per IP)
  → ContactMessageSerializer.is_valid()
  → ContactMessage.save()
  → send_mail() to ADMIN_EMAIL (fail_silently=True)
  → 201 { "message": "..." }
```

### M-Pesa STK Push

```
Browser  POST /api/payments/mpesa/stk-push/
  → MpesaSTKPushSerializer.is_valid()
  → PreOrder.create(status='processing')
  → daraja.stk_push() → Safaricom API → phone receives push notification
  → 200 { order_id, checkout_request_id, message }

Safaricom  POST /api/payments/mpesa/callback/
  → MpesaCallbackView.post()
  → PreOrder.update(status='paid', mpesa_receipt_number=...)

Browser  GET /api/payments/orders/<uuid>/  (polled every 5s)
  → PreOrderSerializer → 200 { status: 'paid' }
```

### Stripe card payment

```
Browser  POST /api/payments/stripe/create-intent/
  → StripeIntentSerializer.is_valid()
  → PreOrder.create(status='processing')
  → stripe.PaymentIntent.create()
  → 200 { client_secret, publishable_key, order_id }

Browser  stripe.confirmCardPayment(client_secret)  [Stripe Elements]
  → Stripe processes the card

Stripe  POST /api/payments/stripe/webhook/
  → Webhook.construct_event() (signature verified)
  → event type = payment_intent.succeeded
  → PreOrder.update(status='paid')
```

### Blog article reaction

```
Browser  POST /api/blog/articles/<slug>/react/
  Body: { "reaction": "fire" }
  Header: X-Fingerprint: <browser fingerprint>

  → BlogReactionToggleView.post()
  → BlogReaction.objects.filter(article, fingerprint).first()
  → If same reaction: delete → active_reaction = None
  → If different reaction: update → active_reaction = new type
  → If none: create → active_reaction = submitted type
  → 200 { reaction, summary: { fire: 3, heart: 1, ... } }
```

---

## Infrastructure

| Component | Provider | Notes |
|-----------|----------|-------|
| Backend hosting | Render (web service) | Gunicorn, auto-deploys on push to `production` via deploy hook |
| Backend database | Render PostgreSQL | `DATABASE_URL` injected as env var; `dj-database-url` parses it |
| Media files | Render Disk | Persistent disk mounted at `/media/`; future migration path to S3 |
| Frontend hosting | Vercel | CDN-distributed SPA; auto-deploys via `deploy-production.yml` |
| DNS | External registrar | `koboko.dev` → Vercel; `api.koboko.dev` → Render |
| SSL/TLS | Render + Vercel | Both platforms terminate TLS at their edge; backend uses `SECURE_PROXY_SSL_HEADER` |
| CI/CD | GitHub Actions | Four workflows: `ci`, `deploy-production`, `pr-checks`, `scheduled-checks` |

---

## Security Architecture

See [SECURITY.md](../SECURITY.md) for the full security policy.

**Defence-in-depth layers:**

1. **Network** — TLS everywhere; Render and Vercel handle certificate management.
2. **Transport** — HSTS forces HTTPS for all future visits; `SECURE_PROXY_SSL_HEADER` ensures Django correctly identifies secure requests.
3. **Application** — Django security middleware adds XSS, CSRF, clickjacking, and sniff-type headers automatically.
4. **API** — CORS restricted to known origins; DRF throttles prevent abuse; no raw SQL in the codebase.
5. **Payment** — Stripe signature verification on every webhook; no card data touches the server; M-Pesa receipts stored only after confirmed callback.
6. **Secrets** — All credentials via environment variables; `SECRET_KEY` validation refuses production startup with the default development key.
7. **Dependencies** — Weekly automated CVE audit via `pip-audit` and `npm audit`.
