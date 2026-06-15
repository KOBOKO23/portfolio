# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

---

## [1.0.0] — 2026-06-15

First full production release. Backend deployed to Render, frontend to Vercel.

### Added

**Backend**
- Django REST Framework API with 11 apps: blog, books, contact, core, fashion, feedback, great\_men\_moves, music, newsletter, payments, projects
- M-Pesa STK Push + Daraja callback handling for Kenyan mobile payments
- Stripe PaymentIntent flow with webhook verification for international card payments
- Rate limiting: named throttle scopes (5/hr contact, 5/hr newsletter, 200/hr global anonymous)
- `created_at` and `updated_at` timestamp fields on the Project model
- `dj-database-url` DATABASE\_URL-first database configuration for Render PostgreSQL
- `SECURE_PROXY_SSL_HEADER` for correct HTTPS detection behind Render's load balancer
- Render Blueprint (`render.yaml`) declaring web service and PostgreSQL add-on as code
- Module-level docstrings on all `views.py` and `serializers.py` files

**Frontend**
- React 18 + TypeScript + Vite + Tailwind CSS
- 13 pages: Home, About, Projects, Project Detail, Blog, Blog Detail, Fashion, Music, Book, Great Men Moves, Contact, Newsletter, Weather Forecast
- Lazy-loaded page chunks for optimal Lighthouse performance score
- Per-page SEO meta tags via `react-helmet-async`
- Skip-to-content link for keyboard accessibility (WCAG 2.1 AA)
- PWA assets: favicon, apple-touch-icon, `site.webmanifest`, Open Graph image

**CI/CD**
- GitHub Actions: `ci.yml` (lint, test, typecheck, build, E2E on all active branches)
- GitHub Actions: `deploy-production.yml` (Render deploy hook + Vercel on push to `production`)
- GitHub Actions: `pr-checks.yml` (conventional commits, PR size, auto-label)
- GitHub Actions: `scheduled-checks.yml` (weekly pip-audit + npm audit + stale branch report)

**Developer tooling**
- `scripts/setup.sh` — first-time environment bootstrap
- `scripts/dev.sh` — parallel backend + frontend dev server launcher
- `scripts/test.sh` — backend, frontend, and E2E test runner with flags
- `scripts/lint.sh` — ruff + ESLint + TypeScript + Prettier in one command
- `scripts/migrate.sh` — Django migrations with pending-check gate
- `scripts/deploy-check.sh` — pre-deploy validation gate (Django check, migrations, tsc, build)
- `scripts/createsuperuser.sh` — non-interactive superuser via env vars

**Documentation**
- `README.md`, `backend/README.md`, `src/README.md`
- `docs/architecture.md`, `docs/api-reference.md`, `docs/deployment.md`
- `docs/development.md`, `docs/testing.md`, `docs/branch-strategy.md`
- `docs/adr/` — Architecture Decision Records for key technical choices
- `CONTRIBUTING.md`, `SECURITY.md`, `CODE_OF_CONDUCT.md`, `LICENSE`
- `.github/PULL_REQUEST_TEMPLATE.md` and issue templates

### Changed

- Rewrote `scripts/backup.sh` to support `DATABASE_URL`-first backup; removed `venv` activation dependency
- Updated `scripts/pg_switch.sh` to use `python3` directly (no venv activation required)
- Moved `react` and `react-dom` from `peerDependencies` to `dependencies` in `package.json`
- Fixed Vite `@` alias: was resolving to `src/src/` (nonexistent); corrected to `src/app/`

### Removed

- `scripts/aws_deploy.sh` — AWS ECS deployment script
- `scripts/aws_infra_setup.sh` — AWS VPC/ECS/RDS provisioning
- `scripts/deploy.sh` — bare-metal SSH + systemd deployment
- `scripts/vercel_deploy.sh` — manual Vercel deploy (replaced by CI)
- `docker-compose.yml` — local Docker stack with Nginx
- `Dockerfile` (root) — frontend Nginx container image
- `nginx/nginx.conf` — orphaned Nginx config
- `.github/workflows/deploy-backend.yml` — AWS ECS deploy workflow
- `.github/workflows/deploy-frontend.yml` — replaced by `deploy-production.yml`

---

## [0.9.0] — 2026-05-20

Internal pre-release. Core feature set complete; deployment infrastructure still AWS-based.

### Added
- All 11 Django apps with full model, serializer, view, URL, and admin registration
- React frontend with all 13 pages
- 92 Django tests + 61 Vitest unit tests
- Playwright E2E test suite
- Admin CMS with Jazzmin theme
- Blog reactions (emoji), likes (fingerprint-based), share counters

---

[Unreleased]: https://github.com/KOBOKO23/portfolio/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/KOBOKO23/portfolio/compare/v0.9.0...v1.0.0
[0.9.0]: https://github.com/KOBOKO23/portfolio/releases/tag/v0.9.0
