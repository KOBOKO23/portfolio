# ADR 003 — SECURE_PROXY_SSL_HEADER over SECURE_SSL_REDIRECT

**Status:** Accepted  
**Date:** 2026-06-15  
**Author:** Philip Oduya

---

## Context

Django provides two mechanisms for enforcing HTTPS:

**`SECURE_SSL_REDIRECT = True`**  
Django itself redirects HTTP requests to HTTPS. Works when Django is the TLS termination point.

**`SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")`**  
Django trusts the `X-Forwarded-Proto` header set by a proxy to determine whether the original request was HTTPS. The redirect happens at the proxy, not in Django.

The initial production configuration used `SECURE_SSL_REDIRECT = True`. This caused an **infinite redirect loop** on Render.

## Root Cause

Render terminates TLS at its load balancer and forwards requests to Gunicorn over plain HTTP internally. From Gunicorn's perspective, every incoming request is HTTP — regardless of whether the browser connected over HTTPS. With `SECURE_SSL_REDIRECT = True`:

```
Browser  → HTTPS → Render load balancer → HTTP → Gunicorn
                                                    ↓
                                           Django sees HTTP
                                           SECURE_SSL_REDIRECT → redirect to HTTPS
                                                    ↓
                                           Browser receives redirect back to HTTPS
                                                    ↓
                                           Infinite loop
```

## Decision

Replace `SECURE_SSL_REDIRECT = True` with:

```python
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
SILENCED_SYSTEM_CHECKS = ['security.W008']
```

Render's load balancer sets `X-Forwarded-Proto: https` on all requests from browsers that connected over TLS. Django reads this header and correctly treats those requests as HTTPS.

`W008` is Django's warning that `SECURE_SSL_REDIRECT` is not enabled. The silence is intentional and documented.

## Rationale

This is the [officially recommended pattern](https://docs.djangoproject.com/en/4.2/ref/settings/#secure-proxy-ssl-header) for PaaS platforms that terminate TLS at the edge:

> If your Django app is behind a proxy, the proxy may be swallowing whether the original request uses HTTP or HTTPS. ... In this case, you can use `SECURE_PROXY_SSL_HEADER`.

All major PaaS documentation (Heroku, Render, Railway, Fly.io) recommends this approach.

## Security implications

This setting only works safely when:

1. **The proxy sets the header** — Render does this for all external HTTPS requests.
2. **External requests cannot forge the header** — Render strips `X-Forwarded-Proto` from incoming requests before setting its own value, preventing spoofing.

If the application were moved to a direct-server deployment (no proxy), `SECURE_PROXY_SSL_HEADER` would need to be removed and `SECURE_SSL_REDIRECT` re-enabled.

## Consequences

- No redirect loop on Render
- `manage.py check --deploy` exits 0 (W008 silenced)
- HTTPS is still enforced — non-HTTPS requests are handled at the Render edge, not in Django
- HSTS header (`Strict-Transport-Security`) is still set by `SecurityMiddleware`, instructing browsers to always use HTTPS
