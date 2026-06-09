"""
CI settings — extends the main settings module.

Inherits all production defaults, then overrides only what cannot work in a
plain HTTP CI environment:
  - SECURE_SSL_REDIRECT and HSTS disabled (no TLS in CI)
  - SESSION/CSRF secure-cookie flags off   (cookies over HTTP)
  - CORS restricted to the CI preview URL  (not wide-open like DEBUG=True)
  - Email routed to console backend        (no real SMTP in CI)
  - Logging reduced to WARNING             (keeps CI output readable)

Everything else — CORS enforcement, real WSGI workers, error handling,
middleware order, response headers — runs exactly as in production.
"""
from .settings import *  # noqa: F401,F403

# ── Core ──────────────────────────────────────────────────────────────────────
DEBUG = False

# Suppress the insecure-key check: CI uses a throwaway key intentionally
SECRET_KEY = SECRET_KEY  # noqa: F405 — already set via env in CI

# ── HTTPS-only guards — disabled because CI has no TLS ────────────────────────
SECURE_SSL_REDIRECT = False
SECURE_HSTS_SECONDS = 0
SECURE_HSTS_INCLUDE_SUBDOMAINS = False
SECURE_HSTS_PRELOAD = False
SESSION_COOKIE_SECURE = False
CSRF_COOKIE_SECURE = False

# ── CORS — explicit allowlist, not the wide-open DEBUG shortcut ───────────────
CORS_ALLOW_ALL_ORIGINS = False
CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]
CSRF_TRUSTED_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

# ── Email — console backend so tests never hit a real SMTP server ─────────────
EMAIL_BACKEND = "django.core.mail.backends.console.EmailBackend"

# ── Logging — WARNING only; suppress the INFO noise from gunicorn workers ─────
LOGGING["handlers"]["console"]["level"] = "WARNING"   # noqa: F405
LOGGING["root"]["level"] = "WARNING"                  # noqa: F405

# ── Deploy-check silences — suppress warnings that are intentionally disabled
#    in CI (no TLS, throwaway key).  Any other warning still fails the build. ──
SILENCED_SYSTEM_CHECKS = [
    "security.W004",  # SECURE_HSTS_SECONDS — no TLS in CI
    "security.W008",  # SECURE_SSL_REDIRECT — no TLS in CI
    "security.W009",  # SECRET_KEY strength — CI uses a throwaway key
    "security.W012",  # SESSION_COOKIE_SECURE — HTTP-only CI
    "security.W016",  # CSRF_COOKIE_SECURE — HTTP-only CI
]
