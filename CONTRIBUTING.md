# Contributing

Thank you for taking the time to contribute. This document explains how to set up your development environment, the coding standards this project follows, and the process for getting a change merged.

---

## Table of Contents

- [Prerequisites](#prerequisites)
- [First-Time Setup](#first-time-setup)
- [Branch and Commit Conventions](#branch-and-commit-conventions)
- [Backend Standards](#backend-standards)
- [Frontend Standards](#frontend-standards)
- [Writing Tests](#writing-tests)
- [Adding a New API Endpoint](#adding-a-new-api-endpoint)
- [Adding a New Frontend Page](#adding-a-new-frontend-page)
- [Database Migrations](#database-migrations)
- [Pull Request Process](#pull-request-process)

---

## Prerequisites

| Tool | Minimum version | Notes |
|------|-----------------|-------|
| Python | 3.11 | `python3 --version` |
| Node.js | 20 | `node --version` |
| npm | 9 | `npm --version` |
| Git | 2.40 | |

---

## First-Time Setup

```bash
git clone https://github.com/KOBOKO23/portfolio.git
cd portfolio
./scripts/setup.sh
```

`setup.sh` creates the Python virtual environment, installs all dependencies, copies `.env.example` files, runs migrations, seeds the database, and creates a default `admin / admin123` superuser for local use.

To start both servers afterward:

```bash
./scripts/dev.sh
# Backend  → http://localhost:8000
# Frontend → http://localhost:5173
# Admin    → http://localhost:8000/admin
```

---

## Branch and Commit Conventions

Cut feature branches from `development`, not `main`:

```bash
git checkout development
git pull origin development
git checkout -b feat/my-feature
```

All commits must follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <short description>
```

| Type | When to use |
|------|------------|
| `feat` | New user-facing feature |
| `fix` | Bug fix |
| `chore` | Maintenance, tooling, dependency updates |
| `docs` | Documentation only |
| `ci` | CI/CD workflow changes |
| `refactor` | Code restructuring without behaviour change |
| `test` | Adding or updating tests |
| `perf` | Performance improvement |
| `style` | Formatting only — no logic change |

Examples:

```
feat(blog): add article bookmarking with localStorage persistence
fix(payments): handle Daraja callback when receipt number is absent
docs(api): document the /api/payments/mpesa/stk-push/ request body
```

The `pr-checks.yml` CI workflow enforces this format on every PR commit.

---

## Backend Standards

### Code style

This project uses [ruff](https://docs.astral.sh/ruff/) for linting and formatting. The configuration is in `pyproject.toml`.

```bash
# Check
cd backend && ruff check .

# Auto-fix
cd backend && ruff check . --fix && ruff format .
```

Or from the repo root: `./scripts/lint.sh --fix`

### Django conventions

- All views must inherit from a DRF generic view or `APIView`.
- Never use `@csrf_exempt` — DRF's `SessionAuthentication` and `TokenAuthentication` handle CSRF automatically; public endpoints are fine without any decorator.
- Add a module-level docstring to every new `views.py` and `serializers.py` listing the endpoints it serves.
- New throttle requirements go in `backend/config/settings.py` under `DEFAULT_THROTTLE_RATES` with a named scope.
- Use `get_object_or_404` rather than catching `DoesNotExist` manually.
- Query optimisations (`select_related`, `prefetch_related`) belong on the queryset in the view, not inside the serializer.

### Security checklist for new endpoints

- [ ] Does this endpoint need rate limiting? Add a named `AnonRateThrottle` subclass.
- [ ] Does it accept user-supplied HTML or Markdown? Pass through `bleach` + `markdown`.
- [ ] Does it write to the database? Add an integration test for the success and validation-error paths.

---

## Frontend Standards

### Code style

- ESLint + Prettier enforce style automatically. Run `npm run lint` and `npm run format:check` before pushing.
- TypeScript strict mode is on. No `any` casts without a `// eslint-disable` comment explaining why.

### Component conventions

- One component per file. Named exports only (no default exports except for lazy-loaded page modules).
- Pages live in `src/app/pages/`. Each page is lazy-loaded in `src/app/routes.tsx`.
- Shared components live in `src/app/components/`.
- API calls go through the helpers in `src/app/utils/` — do not `fetch()` directly inside components.
- Use `react-helmet-async` (`<SEO />` component) on every page for title and Open Graph tags.

---

## Writing Tests

### Backend

Tests live alongside the app code in `apps/<name>/tests.py`. Use Django's `TestCase` and the DRF `APIClient`.

```python
from django.test import TestCase
from rest_framework.test import APIClient

class ContactCreateTest(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_valid_submission_returns_201(self):
        response = self.client.post('/api/contact/messages/', {
            'name': 'Test',
            'email': 'test@example.com',
            'subject': 'general',
            'message': 'Hello',
        })
        self.assertEqual(response.status_code, 201)
```

Run the full suite:

```bash
./scripts/test.sh --backend-only
```

### Frontend

Vitest tests live in `src/app/**/__tests__/` or as `*.test.ts(x)` files next to the module they test.

```typescript
import { describe, it, expect } from 'vitest';
import { formatReadTime } from '../utils/format';

describe('formatReadTime', () => {
  it('returns singular for 1 minute', () => {
    expect(formatReadTime(1)).toBe('1 min read');
  });
});
```

Run the full suite:

```bash
./scripts/test.sh --frontend-only
```

---

## Adding a New API Endpoint

1. Add the model to `apps/<name>/models.py` and create a migration: `python manage.py makemigrations <name>`.
2. Register the model in `apps/<name>/admin.py`.
3. Write the serializer in `apps/<name>/serializers.py` with a module docstring.
4. Write the view in `apps/<name>/views.py` with a module docstring listing the new endpoint.
5. Wire the URL in `apps/<name>/urls.py` and include it in `config/urls.py`.
6. Write at least one test covering the happy path and one for invalid input.
7. Update `docs/api-reference.md` with the new endpoint.

---

## Adding a New Frontend Page

1. Create `src/app/pages/MyPage.tsx` as a named export (`export function MyPage`).
2. Add a lazy import and route entry in `src/app/routes.tsx`.
3. Add a `<SEO>` component at the top of the page with a unique `title` and `description`.
4. Add the route to the `navItems` array in `Navigation.tsx` if it should appear in the nav.

---

## Database Migrations

Never edit migration files by hand. Always generate them:

```bash
cd backend
python manage.py makemigrations <app_name> --name describe_the_change
python manage.py migrate
```

If a migration is data-only (no schema change), use a `RunPython` operation in a separate migration file.

---

## Pull Request Process

1. Push your branch and open a PR targeting `development`.
2. Fill in the pull request template (summary, test plan, screenshots for UI changes).
3. Ensure CI passes — `backend`, `frontend`, and `e2e` jobs must all be green.
4. Request a review. One approving review is required to merge into `development`.
5. Squash-merge or rebase — no merge commits in `development`.

For the promotion path (`development` → `test` → `main` → `production`) see [docs/branch-strategy.md](docs/branch-strategy.md).
