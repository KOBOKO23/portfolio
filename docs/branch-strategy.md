# Branch Strategy

## Overview

This repository uses a four-branch promotion model:

```
main           ← stable source of truth; CI must be green before merging here
 ├─ production ← auto-deploys to Render (backend) and Vercel (frontend) on push
 ├─ development ← active feature work; all feature branches merge here
 └─ test        ← QA / pre-release validation; promoted from development
```

## Branch Purposes

| Branch | Purpose | Triggers deploy? |
|--------|---------|-----------------|
| `main` | Stable, production-equivalent source of truth | No |
| `production` | Receives merges from `main`; CI fires deploy workflow | Yes — Render + Vercel |
| `development` | Daily active development; feature branches merge here | No |
| `test` | Pre-release QA; merged from `development`, validated before promotion | No |

## Standard Feature Flow

1. Cut a feature branch from `development`:
   ```bash
   git checkout -b feat/my-feature development
   ```
2. Open a pull request targeting `development`; CI runs automatically.
3. After review and CI green, merge to `development`.
4. When a release is ready, merge `development` → `test` and run E2E validation.
5. Promote: merge `test` → `main` (requires 1 review + CI green).
6. Deploy: merge `main` → `production` — GitHub Actions fires the Render deploy hook and Vercel deployment.

## Branch Protection Rules

Apply these in **GitHub → Settings → Branches → Branch protection rules**.

### `main`

- Require a pull request before merging
- Require 1 approving review
- Require status checks to pass: `backend`, `frontend`
- Do not allow bypassing the above settings
- Disallow force pushes
- Disallow branch deletions

### `production`

- Require a pull request before merging
- Require status checks: `backend`, `frontend`, `e2e`
- Disallow force pushes
- Disallow branch deletions

### `development`

- Require status checks: `backend`, `frontend`

## Commit Convention

All commits must follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<optional-scope>): <short description>

[optional body]

[optional footer]
```

Allowed types:

| Type | Use for |
|------|---------|
| `feat` | New feature or user-facing capability |
| `fix` | Bug fix |
| `chore` | Maintenance, tooling, dependency updates |
| `docs` | Documentation only |
| `ci` | CI/CD workflow changes |
| `refactor` | Code restructuring without behaviour change |
| `test` | Adding or updating tests |
| `perf` | Performance improvement |
| `style` | Formatting, whitespace — no logic change |
| `revert` | Reverts a previous commit |

Examples:

```
feat(blog): add emoji reaction toggle with fingerprint deduplication
fix(payments): handle Daraja callback when MerchantRequestID is missing
chore(deps): upgrade dj-database-url to 2.1
ci: replace AWS ECS deploy workflow with Render deploy hook
docs(backend): add module-level docstrings to all views and serializers
```

## CI Workflows

| Workflow | Trigger | Jobs |
|----------|---------|------|
| `ci.yml` | Push / PR to `main`, `development`, `test` | backend lint + test, frontend lint + typecheck + build + E2E |
| `deploy-production.yml` | Push to `production` | Render deploy hook + health check, Vercel deploy |
| `pr-checks.yml` | Pull request to `main`, `development`, `test` | Conventional commit check, PR size warning, auto-label |
| `scheduled-checks.yml` | Every Monday 07:00 UTC | pip-audit, npm audit, stale branch report |
