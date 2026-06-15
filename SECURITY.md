# Security Policy

## Supported Versions

| Version | Supported |
|---------|-----------|
| `main` branch | ✅ Active — receives security patches |
| `production` branch | ✅ Active — receives security patches |
| All other branches | ❌ No security support |

This is a personal portfolio project with a single production deployment. Security fixes are applied directly to `main` and promoted to `production`.

---

## Reporting a Vulnerability

**Please do not report security vulnerabilities via GitHub Issues.** Public disclosure before a fix is in place puts the live site and its users at risk.

### How to report

Email **kobokophilip@gmail.com** with:

- **Subject line:** `[SECURITY] <brief description>`
- A description of the vulnerability and the component affected
- Steps to reproduce or a proof-of-concept
- The potential impact (e.g., data exposure, privilege escalation, CSRF bypass)
- Whether you would like to be credited in the fix

### What to expect

| Timeline | Action |
|----------|--------|
| Within **48 hours** | Acknowledgement that the report was received |
| Within **7 days** | Assessment of severity and an estimated fix timeline |
| Within **30 days** | Fix deployed for most vulnerabilities |
| After fix is deployed | Public disclosure coordinated with the reporter |

---

## Scope

### In scope

- Authentication or authorisation bypasses
- SQL injection, XSS, CSRF in any API endpoint or admin interface
- Payment flow vulnerabilities (Stripe, M-Pesa) that could result in financial loss
- Server-side request forgery (SSRF)
- Sensitive data exposure (API keys, PII, payment data)
- Rate limiting bypasses on contact/newsletter submission endpoints
- Django admin panel exposure or privilege escalation

### Out of scope

- Vulnerabilities in third-party services (Render, Vercel, Stripe, Daraja)
- Brute-force attacks against the admin panel (mitigated at the infrastructure level)
- Self-XSS or social engineering attacks
- Theoretical vulnerabilities without a working proof of concept
- Issues in libraries that already have a public CVE with a fix — open a dependency upgrade PR instead

---

## Security Controls in Place

| Control | Implementation |
|---------|---------------|
| HTTPS | Enforced by Render; `SECURE_PROXY_SSL_HEADER` ensures Django recognises HTTPS requests |
| HSTS | 1-year `Strict-Transport-Security` with preload |
| Security headers | `X-Content-Type-Options`, `X-Frame-Options: DENY`, `Referrer-Policy`, `Permissions-Policy` |
| CORS | Restricted to explicit origins via `django-cors-headers` |
| Rate limiting | Named DRF throttle scopes: 5/hr on contact + newsletter, 200/hr global anonymous |
| Stripe webhook verification | `stripe.Webhook.construct_event` with signature verification |
| SQL injection | Django ORM throughout — no raw SQL |
| Secret key validation | App refuses to boot with the default dev key in production |
| Payment data | No card numbers stored — Stripe handles PCI scope; M-Pesa receipts only stored after payment confirmation |

---

## Dependency Vulnerability Management

Dependencies are audited weekly by the `scheduled-checks.yml` GitHub Actions workflow using `pip-audit` (Python) and `npm audit` (JavaScript). Critical vulnerabilities trigger an immediate patch. See [docs/testing.md](docs/testing.md) for the full security testing approach.
