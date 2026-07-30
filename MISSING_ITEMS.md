# What's not finished yet

The site is live and functional end-to-end (frontend ↔ backend ↔ database all confirmed working), but several things are placeholder/deferred by choice during the initial AWS go-live. No secrets in this file — safe to commit.

## Payments — not functional yet
- **Stripe**: publishable/secret/webhook keys in AWS Secrets Manager (`koboko/backend`) are all `REPLACE_ME` placeholders. Get real **test-mode** keys from the [Stripe dashboard](https://dashboard.stripe.com/test/apikeys), update the secret, redeploy the ECS service, and update `VITE_STRIPE_PUBLISHABLE_KEY` in Vercel.
- Stripe webhook endpoint (`https://<backend-url>/api/payments/stripe/webhook/`) is not registered in the Stripe dashboard — checkout will work but payment confirmation won't.
- **M-Pesa (Daraja)**: consumer key/secret are placeholders. Register a sandbox app at [developer.safaricom.co.ke](https://developer.safaricom.co.ke) and update the secret.

## Email — done
- Real sending is enabled via Gmail SMTP (`EMAIL_BACKEND=smtp`, `EMAIL_HOST_USER`/`EMAIL_HOST_PASSWORD` = an app password for `kobokophilip@gmail.com` in the `koboko/backend` secret). Verified with a direct `send_mail()` test and a real contact-form submission — both succeeded.
- `ADMIN_EMAIL` and `DEFAULT_FROM_EMAIL` both point at `kobokophilip@gmail.com`, so contact form, volunteer application, and newsletter notifications all land there — there's no separate `info@koboko.co.ke` mailbox yet since Truehost's offering for that hasn't been confirmed. Revisit once/if a domain mailbox exists; until then this is the intended permanent-ish routing, not a placeholder.
- Contact form notifications use `fail_silently=True` (`apps/contact/views.py`), so a `201` response doesn't by itself prove the email sent — if delivery ever seems to stop working, check via a direct `send_mail()` one-off task rather than trusting the form's success response alone.

## Custom domain — done
- `koboko.co.ke` (registered at Truehost Kenya) is now live: root + `www` → Vercel frontend, `api.koboko.co.ke` → AWS backend via CloudFront, with a valid ACM certificate.
- DNS for the domain was moved from Truehost to Vercel's nameservers, since Truehost's panel had no per-record zone editor for this domain — see `CREDENTIALS.md` for the full record list and how to manage them via `vercel dns`.
- The old `koboko.dev` references in `render.yaml`/`docs/deployment.md` are stale — the real production domain is `koboko.co.ke`.

## Admin static files — fixed
- The Django admin was rendering unstyled (no CSS/JS) because `collectstatic` runs at Docker *build* time, before `USE_S3` is set, so assets never made it to S3. Fixed by running `collectstatic` as a one-off ECS task against the real production config, and by changing `backend/config/settings.py` to stop setting per-object S3 ACLs (`AWS_DEFAULT_ACL = None`) since the bucket uses `BucketOwnerEnforced` + a public-read bucket policy instead of ACLs.
- Any time new static assets are added (new admin customizations, new Jazzmin config, etc.), `collectstatic` needs to be re-run as a one-off ECS task — see `CREDENTIALS.md` for the exact command. It does not happen automatically on deploy.

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
- `.github/workflows/deploy-production.yml` now deploys to AWS ECS/ECR + Vercel on push to `production` (or manual dispatch): builds & pushes the image, registers a new task definition, runs migrations as a one-off task, rolls out the ECS service, then builds/deploys the frontend.
- AWS auth uses GitHub's OIDC provider + the `koboko-github-actions-deploy` IAM role — no static AWS keys stored in GitHub.
- **`VERCEL_TOKEN` GitHub secret is still missing** — the Vercel CLI can't self-issue tokens for OAuth-device sessions, so this has to be created manually at https://vercel.com/account/tokens and added with `gh secret set VERCEL_TOKEN --env production --repo KOBOKO23/portfolio`. Until this is set, the frontend deploy job will fail.
- `render.yaml` and the old Render-based deployment docs are still in the repo but unused — the project no longer deploys to Render.
- The pipeline hasn't been tested end-to-end yet (nothing has been pushed to the `production` branch). First real run should be watched closely.
- **Known gotcha for future deploys**: `ALLOWED_HOSTS` must stay `*` in the task definition. Scoping it to a specific host list breaks the ALB health check (it probes using the task's private IP as `Host`), which silently crash-loops the ECS service. This regressed once already during the domain cutover — see the warning in `CREDENTIALS.md`.
