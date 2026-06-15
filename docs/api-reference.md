# API Reference

**Base URL (production):** `https://api.koboko.dev/api`  
**Base URL (local dev):** `http://localhost:8000/api`

## Authentication

All endpoints are public. No API key or JWT is required. Rate limiting is applied per IP address (see [Rate Limiting](#rate-limiting)).

## Response Format

Every response is wrapped in a standard envelope:

```json
// Success
{ "success": true, "data": { ... } }

// Error
{ "success": false, "error": { "message": "...", "details": { ... } } }
```

Paginated list responses include:
```json
{
  "success": true,
  "data": {
    "count": 42,
    "next": "https://api.koboko.dev/api/blog/articles/?page=2",
    "previous": null,
    "results": [ ... ]
  }
}
```

## Rate Limiting

| Scope | Limit | Applies to |
|-------|-------|-----------|
| `contact` | 5 requests / hour | `POST /api/contact/messages/` |
| `newsletter` | 5 requests / hour | `POST /api/newsletter/subscribe/` |
| Global (anonymous) | 200 requests / hour | All other endpoints |

Rate limit headers are returned on every response:
```
X-RateLimit-Limit: 200
X-RateLimit-Remaining: 197
```

---

## Core

### Health Check

```
GET /api/health/
```

Returns the application and database status. Used by monitoring and Render's health check probe.

**Response 200 — healthy:**
```json
{ "status": "ok", "db": true }
```

**Response 503 — database unreachable:**
```json
{ "status": "degraded", "db": false }
```

---

### Profile

```
GET /api/profile/
```

Returns the site owner's full profile including bio, social links, and skills.

**Response 200:**
```json
{
  "id": 1,
  "full_name": "Philip Oduya",
  "tagline": "Meteorologist · Developer · Author",
  "bio": "...",
  "profile_image": "https://api.koboko.dev/media/profile/photo.jpg",
  "resume_pdf": "https://api.koboko.dev/media/profile/cv.pdf",
  "email": "kobokophilip@gmail.com",
  "phone": "+254700000000",
  "location": "Nairobi, Kenya",
  "linkedin_url": "https://linkedin.com/in/...",
  "github_url": "https://github.com/KOBOKO23",
  "twitter_url": "...",
  "instagram_url": "...",
  "years_experience": 5,
  "projects_completed": 20,
  "skills": [ { "id": 1, "name": "Django", "category": "backend", "proficiency": 90, "icon": "..." } ]
}
```

---

### Skills

```
GET /api/skills/
```

Returns all skills (not paginated).

---

### Career Timeline

```
GET /api/career/
```

Returns career events in display order (not paginated).

**Response item:**
```json
{
  "id": 1,
  "year": "2022",
  "title": "Backend Engineer",
  "organization": "...",
  "description": "...",
  "is_current": false,
  "order": 1
}
```

---

### Weather Forecast

```
GET /api/weather/forecast/
```

Returns a 72-hour weather forecast for Nairobi proxied from OpenWeatherMap. Returns mock data if `OPENWEATHER_API_KEY` is not configured.

---

## Blog

### List Categories

```
GET /api/blog/categories/
```

Returns all blog categories (not paginated).

---

### List Articles

```
GET /api/blog/articles/
```

Returns published articles. Paginated (20 per page).

**Query parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `search` | string | Full-text search across title, excerpt, content, author, tags |
| `category__slug` | string | Filter by category slug (e.g. `technology`) |
| `is_featured` | boolean | Filter featured articles (`true` / `false`) |
| `language` | string | Filter by language code (e.g. `en`, `sw`) |
| `ordering` | string | Sort field: `published_date`, `views`, `read_time` (prefix `-` for descending) |
| `page` | integer | Page number |

---

### Get Article

```
GET /api/blog/articles/<slug>/
```

Returns full article detail including rendered HTML, gallery images, and social engagement counts. Increments `views` by 1 on each retrieval.

**Extra fields vs list:**
- `content_html` — Markdown rendered to sanitised HTML
- `reaction_summary` — `{ "fire": 3, "heart": 1, ... }`
- `share_counts` — `{ "twitter": 10, "facebook": 5, ... }`
- `user_liked` — boolean (based on `X-Fingerprint` header)
- `user_reaction` — string or null (based on `X-Fingerprint` header)
- `gallery` — array of image objects

---

### List / Create Comments

```
GET  /api/blog/articles/<slug>/comments/
POST /api/blog/articles/<slug>/comments/
```

GET returns top-level approved comments with nested replies.

POST creates a new comment. Returns `403` if `allow_comments=False` on the article.

**POST body:**
```json
{
  "author_name": "Jane Doe",
  "author_email": "jane@example.com",
  "content": "Great article!",
  "parent": null
}
```

`parent` is the ID of the comment being replied to, or `null` for top-level.

---

### Toggle Like

```
POST /api/blog/articles/<slug>/like/
```

Toggles a like on the article. Identified by `X-Fingerprint` header (browser fingerprint) or IP address.

**Response:**
```json
{ "liked": true, "count": 14 }
```

---

### Add Reaction

```
POST /api/blog/articles/<slug>/react/
```

Adds, swaps, or removes an emoji reaction. Posting the same reaction type twice removes it.

**Request body:**
```json
{ "reaction": "fire" }
```

Valid `reaction` values: `fire`, `heart`, `clap`, `mind_blown`, `sad`

**Response:**
```json
{
  "reaction": "fire",
  "summary": { "fire": 4, "heart": 2 }
}
```

---

### Record Share

```
POST /api/blog/articles/<slug>/share/<platform>/
```

Increments the share counter for the given platform.

Valid `platform` values: `twitter`, `facebook`, `linkedin`, `whatsapp`, `copy_link`

**Response:**
```json
{ "platform": "twitter", "count": 11 }
```

---

## Projects

### List Categories

```
GET /api/projects/categories/
```

---

### List Projects

```
GET /api/projects/
```

Paginated. Supports `?category__slug=`, `?is_featured=`, `?year=`, `?search=`, and `?ordering=year,order`.

---

### Get Project

```
GET /api/projects/<slug>/
```

Returns full project including gallery images array.

---

## Books

### List Books

```
GET /api/books/
```

Returns all books including nested chapters and testimonials.

---

### Book Testimonials

```
GET /api/books/<id>/testimonials/
```

Returns testimonials for a specific book (not paginated).

---

## Music

### List Tracks

```
GET /api/music/tracks/
```

Supports `?search=` across title and description.

**Response item:**
```json
{
  "id": 1,
  "title": "Amazing Grace",
  "slug": "amazing-grace",
  "description": "...",
  "cover_image": "https://...",
  "youtube_url": "https://youtube.com/watch?v=...",
  "spotify_url": "https://open.spotify.com/track/...",
  "apple_music_url": null,
  "soundcloud_url": null,
  "release_date": "2024-01-15",
  "duration": "3:45",
  "is_featured": true
}
```

---

## Fashion

### List Categories

```
GET /api/fashion/categories/
```

---

### List Images

```
GET /api/fashion/images/
```

Supports `?category__slug=` and `?search=` across title, description, location.

---

## Great Men Moves

### List Programmes

```
GET /api/great-men-moves/programs/
```

Returns active programmes only (not paginated).

---

### List Impact Goals

```
GET /api/great-men-moves/goals/
```

---

### Submit Volunteer Application

```
POST /api/great-men-moves/volunteer/
```

**Request body:**
```json
{
  "full_name": "John Kamau",
  "email": "john@example.com",
  "phone": "+254700000000",
  "profession": "Teacher",
  "motivation": "I want to help young men..."
}
```

Triggers an admin notification email to `ADMIN_EMAIL`.

---

## Contact

### Submit Contact Message

```
POST /api/contact/messages/
```

**Rate limit:** 5 per hour per IP.

**Request body:**
```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "subject": "general",
  "message": "Hello! I'd like to discuss a project..."
}
```

Valid `subject` values: `general`, `project`, `speaking`, `mentorship`, `other`

Triggers an admin notification email to `ADMIN_EMAIL`.

**Response 201:**
```json
{ "message": "Message received! I'll get back to you within 24 hours." }
```

---

## Newsletter

### Subscribe

```
POST /api/newsletter/subscribe/
```

**Rate limit:** 5 per hour per IP.

**Request body:**
```json
{ "name": "Jane", "email": "jane@example.com" }
```

- New subscriber → `201 Created`
- Previously unsubscribed (resubscription) → `200 OK`
- Already active subscriber → `400 Bad Request`

---

### List Issues

```
GET /api/newsletter/issues/
```

Paginated list of published newsletter issues in reverse number order.

---

## Payments

### M-Pesa STK Push

```
POST /api/payments/mpesa/stk-push/
```

Initiates a Safaricom M-Pesa STK Push to the customer's phone. Creates a `PreOrder` with `status=processing`.

**Request body:**
```json
{
  "name": "John Kamau",
  "email": "john@example.com",
  "phone": "254712345678",
  "amount": 1500
}
```

`phone` must be in `254XXXXXXXXX` format (no `+`, no spaces). `0712...` is automatically normalised.

**Response 200:**
```json
{
  "success": true,
  "data": {
    "order_id": "550e8400-e29b-41d4-a716-446655440000",
    "checkout_request_id": "ws_CO_...",
    "message": "Check your phone to complete payment."
  }
}
```

**Response 502** — Daraja API unavailable.

---

### M-Pesa Callback (Daraja → Server)

```
POST /api/payments/mpesa/callback/
```

This endpoint is called by Safaricom Daraja, not by the browser. It updates the `PreOrder` status to `paid` (with receipt number) or `failed`.

Always returns `200` to prevent Daraja retrying:
```json
{ "ResultCode": 0, "ResultDesc": "Accepted" }
```

---

### Stripe Create Payment Intent

```
POST /api/payments/stripe/create-intent/
```

Creates a Stripe `PaymentIntent`. The frontend uses the returned `client_secret` to mount Stripe Elements and collect card details.

**Request body:**
```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "amount": 2000,
  "currency": "usd"
}
```

`amount` is in the smallest currency unit (cents for USD, pence for GBP).

**Response 200:**
```json
{
  "success": true,
  "data": {
    "order_id": "550e8400-...",
    "client_secret": "pi_..._secret_...",
    "publishable_key": "pk_live_..."
  }
}
```

---

### Stripe Webhook (Stripe → Server)

```
POST /api/payments/stripe/webhook/
```

Receives `payment_intent.succeeded` and `payment_intent.payment_failed` events from Stripe. Signature is verified with `STRIPE_WEBHOOK_SECRET`. Updates `PreOrder` status accordingly.

**Required Stripe event types to subscribe:**
- `payment_intent.succeeded`
- `payment_intent.payment_failed`

---

### Poll Order Status

```
GET   /api/payments/orders/<uuid>/
PATCH /api/payments/orders/<uuid>/
```

`GET` — Poll the `PreOrder` status. Used by the frontend after STK Push to detect when Daraja callback arrives.

`PATCH` — Frontend confirms Stripe payment success (used when webhook is delayed). Only valid for `payment_method=card` orders in `processing` status.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "550e8400-...",
    "name": "Jane Doe",
    "email": "jane@example.com",
    "amount": "20.00",
    "currency": "USD",
    "payment_method": "card",
    "status": "paid",
    "mpesa_receipt_number": null,
    "created_at": "2026-06-15T10:30:00Z"
  }
}
```

`status` values: `processing` | `paid` | `failed` | `refunded`

---

## Feedback

### Submit Feedback

```
POST /api/feedback/create/
```

**Request body:**
```json
{
  "rating": 5,
  "message": "Great portfolio!",
  "email": "jane@example.com",
  "page_url": "https://koboko.dev/projects"
}
```

`email` and `page_url` are optional. Feedback is stored pending admin approval.

---

### List Approved Feedback

```
GET /api/feedback/list/
```

Returns admin-approved feedback entries only. Fields: `id`, `rating`, `message`, `created_at`.
