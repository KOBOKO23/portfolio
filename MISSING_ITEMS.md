# What's not finished yet

The site is live and functional end-to-end (frontend ↔ backend ↔ database all confirmed working), but several things are placeholder/deferred by choice during the initial AWS go-live. No secrets in this file — safe to commit.

## Payments — not functional yet
- **Stripe**: publishable/secret/webhook keys in AWS Secrets Manager (`koboko/backend`) are all `REPLACE_ME` placeholders. Get real **test-mode** keys from the [Stripe dashboard](https://dashboard.stripe.com/test/apikeys), update the secret, redeploy the ECS service, and update `VITE_STRIPE_PUBLISHABLE_KEY` in Vercel.
- Stripe webhook endpoint (`https://<backend-url>/api/payments/stripe/webhook/`) is not registered in the Stripe dashboard — checkout will work but payment confirmation won't.
- **M-Pesa (Daraja)**: consumer key/secret are placeholders. Register a sandbox app at [developer.safaricom.co.ke](https://developer.safaricom.co.ke) and update the secret.

## Email — not sending
- Backend is running with `EMAIL_BACKEND=console`, meaning contact form / newsletter / notification emails are logged, not actually sent.
- To enable real email: generate a Gmail App Password for `kobokophilip@gmail.com`, put it in the `EMAIL_HOST_PASSWORD` field of the `koboko/backend` secret, and switch `EMAIL_BACKEND` (in the ECS task definition's plain env vars) to `django.core.mail.backends.smtp.EmailBackend`.

## No custom domain
- Site is reachable only via the CloudFront/Vercel default URLs — `koboko.dev` isn't wired up.
- When ready: request an ACM certificate for `koboko.dev`/`api.koboko.dev`, attach it + an alternate domain name to the existing CloudFront distribution, add `koboko.dev` in the Vercel project, and point DNS (CNAMEs) at both. No infrastructure needs to be rebuilt for this.

## No content seeded
The admin/CMS has no real content yet. Minimum to make the site look "real":
| Section | Minimum |
|---|---|
| Core → Profile | 1 record |
| Core → Skills | 5–10 |
| Core → Career Events | Career timeline |
| Projects | 3–5 with images |
| Blog → Articles | 2–3 published |
| Books | 1 record |
| Great Men Moves → Impact Goals | 3–4 |
| Music → Tracks | Any with YouTube links |

Log in at the admin URL in `CREDENTIALS.md` to add these.

## Infrastructure gaps (not blocking, but worth knowing)
- **Single task, no autoscaling**: ECS service runs `desiredCount=1`. A crash means brief downtime until ECS replaces it (usually under a minute), and there's no capacity headroom for traffic spikes.
- **RDS is single-AZ**, 3-day backup retention, not publicly reachable (no direct `psql` access from your laptop — see `CREDENTIALS.md` for the workaround).
- **No `ecs execute-command`** enabled — can't shell into the running container directly; management commands go through one-off `aws ecs run-task` calls (documented in `CREDENTIALS.md`).
- **Admin URL is still the default `/admin/`** — not obscured behind a custom `ADMIN_URL` path like the original Render setup intended.
- Default admin password is a generated random string stored only in `CREDENTIALS.md` — consider rotating it periodically.

## CI/CD
- Being implemented now (see commit history / `.github/workflows/deploy-production.yml`) — pushing to the `production` branch will build, push to ECR, and roll out a new ECS deployment, then deploy the frontend to Vercel.
- `render.yaml` and the old Render-based deployment docs are still in the repo but unused — the project no longer deploys to Render.
