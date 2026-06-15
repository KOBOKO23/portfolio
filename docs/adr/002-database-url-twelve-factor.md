# ADR 002 — DATABASE_URL-First Database Configuration

**Status:** Accepted  
**Date:** 2026-06-15  
**Author:** Philip Oduya

---

## Context

Django's default database configuration uses individual settings variables:

```python
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': os.environ['DB_NAME'],
        'USER': os.environ['DB_USER'],
        'PASSWORD': os.environ['DB_PASSWORD'],
        'HOST': os.environ['DB_HOST'],
        'PORT': os.environ['DB_PORT'],
    }
}
```

The backend is deployed on Render, which injects a single `DATABASE_URL` environment variable of the form `postgresql://user:password@host:port/dbname` when a PostgreSQL add-on is attached to a web service. There is no mechanism to inject the individual `DB_*` variables.

## Decision

Use **`dj-database-url`** to parse `DATABASE_URL` with a cascade:

1. If `DATABASE_URL` is present → parse it (Render production, local PostgreSQL via URL)
2. If `DB_ENGINE=postgresql` → use individual `DB_*` variables (manual local PostgreSQL setup)
3. Otherwise → use SQLite at `backend/db.sqlite3` (default local development)

```python
_DATABASE_URL = os.getenv('DATABASE_URL')
if _DATABASE_URL:
    DATABASES = {'default': dj_database_url.config(
        default=_DATABASE_URL,
        conn_max_age=int(os.getenv('CONN_MAX_AGE', '60')),
        conn_health_checks=True,
        ssl_require=not DEBUG,
    )}
elif os.getenv('DB_ENGINE', 'sqlite') == 'postgresql':
    # individual DB_* vars block
else:
    # SQLite fallback
```

## Rationale

- **12-factor compatibility:** `DATABASE_URL` is the de facto standard for cloud platforms (Render, Heroku, Railway, Fly.io, Supabase). One environment variable instead of five reduces misconfiguration risk.
- **Connection pooling:** `conn_max_age=60` keeps database connections alive for 60 seconds, reducing per-request connection overhead in production.
- **Health checks:** `conn_health_checks=True` validates the connection before use, avoiding stale connection errors after database restarts.
- **SSL enforcement:** `ssl_require=not DEBUG` enforces an encrypted connection to Render's PostgreSQL in production without any additional configuration.
- **Backwards compatibility:** Developers who already have `DB_*` variables in their local `.env` can continue using them. The cascade order ensures `DATABASE_URL` always wins.

## Consequences

- Added `dj-database-url>=2.1` to `requirements.txt`
- `backend/.env.example` documents `DATABASE_URL` as the preferred production configuration
- `scripts/pg_switch.sh` sets individual `DB_*` variables (for local use without a URL-format connection string) — this is still supported by the cascade
- If Render ever changes its variable injection mechanism, only the `DATABASE_URL` variable name would need updating
