# Testing Guide

## Philosophy

Tests in this project serve two purposes: **preventing regressions** and **documenting intent**. A good test tells the next developer what the code is supposed to do without them needing to read the implementation.

Rules:
- Integration tests over unit tests for Django — test through the HTTP layer, not method-by-method.
- Test the behaviour the user cares about, not the internal data structures.
- Every new API endpoint must have at least a happy-path test and one invalid-input test.
- Payment flows must have full mock tests for both success and failure paths.

---

## Running Tests

### All tests

```bash
./scripts/test.sh
```

### Backend only

```bash
./scripts/test.sh --backend-only
# or
cd backend && python manage.py test --verbosity=2
```

### Frontend only

```bash
./scripts/test.sh --frontend-only
# or
cd src && npm test
```

### E2E only

```bash
./scripts/test.sh --e2e
# or
cd src && npm run test:e2e
```

### Single Django app

```bash
cd backend && python manage.py test apps.contact --verbosity=2
```

### Single Vitest file

```bash
cd src && npx vitest run src/app/utils/__tests__/api.test.ts
```

---

## Backend Tests (Django)

Test files live at `backend/apps/<name>/tests.py`.

The project uses Django's standard `TestCase` with the DRF `APIClient`. Tests hit the real SQLite test database — no mocks on the ORM layer.

### Writing a new test

```python
from django.test import TestCase
from rest_framework.test import APIClient


class ArticleLikeTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        # Create test data
        category = BlogCategory.objects.create(name='Tech', slug='tech')
        self.article = BlogArticle.objects.create(
            title='Test Article',
            slug='test-article',
            content='# Hello',
            category=category,
            is_published=True,
        )

    def test_like_returns_liked_true(self):
        """Liking an article the first time returns liked=True."""
        response = self.client.post(
            f'/api/blog/articles/{self.article.slug}/like/',
            HTTP_X_FINGERPRINT='test-fp-001',
        )
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data['data']['liked'])

    def test_like_twice_toggles_to_false(self):
        """Liking an already-liked article removes the like."""
        self.client.post(
            f'/api/blog/articles/{self.article.slug}/like/',
            HTTP_X_FINGERPRINT='test-fp-001',
        )
        response = self.client.post(
            f'/api/blog/articles/{self.article.slug}/like/',
            HTTP_X_FINGERPRINT='test-fp-001',
        )
        self.assertFalse(response.data['data']['liked'])
```

### Testing payment flows

Payment tests mock the external API calls:

```python
from unittest.mock import patch

class MpesaSTKPushTest(TestCase):
    @patch('apps.payments.daraja.stk_push')
    def test_successful_stk_push(self, mock_stk_push):
        mock_stk_push.return_value = {
            'CheckoutRequestID': 'ws_CO_test_123',
            'MerchantRequestID': 'mr_test_456',
            'CustomerMessage': 'Check your phone.',
        }
        response = self.client.post('/api/payments/mpesa/stk-push/', {
            'name': 'Test User',
            'email': 'test@example.com',
            'phone': '254712345678',
            'amount': 100,
        }, format='json')
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data['data']['success'])
```

### What's covered

| App | Coverage |
|-----|---------|
| `blog` | Article CRUD, comments, likes, reactions, shares |
| `contact` | Form submission, rate limiting, admin email |
| `newsletter` | Subscribe, resubscribe, duplicate detection |
| `payments` | STK Push (mock), Daraja callback, Stripe intent (mock), webhook, order polling |
| `projects` | List, detail, category filter |
| `core` | Health check, profile, weather (mock) |

### What needs more coverage

| App | Gap |
|-----|-----|
| `fashion` | No tests — endpoints are simple list views |
| `music` | No tests |
| `great_men_moves` | No tests for volunteer submission email |
| `feedback` | No tests for approval filter |
| `books` | No tests |

---

## Frontend Tests (Vitest)

Test files live as `*.test.ts(x)` next to the module they test, or in `__tests__/` subdirectories.

### Writing a new test

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchArticles } from '../api/blog';

// Mock the global fetch
global.fetch = vi.fn();

describe('fetchArticles', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns parsed articles on success', async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: { results: [{ id: 1, title: 'Hello', slug: 'hello' }] },
      }),
    });

    const result = await fetchArticles();
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe('Hello');
  });

  it('throws on non-ok response', async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ ok: false });
    await expect(fetchArticles()).rejects.toThrow();
  });
});
```

### Testing React components

```typescript
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { SEO } from '../components/SEO';

describe('SEO', () => {
  it('sets the document title', () => {
    render(
      <MemoryRouter>
        <SEO title="Test Page" description="A test" />
      </MemoryRouter>
    );
    expect(document.title).toBe('Test Page | Philip Koboko');
  });
});
```

### What's covered

| Module | Coverage |
|--------|---------|
| `utils/api` | Fetch helpers, caching, error handling |
| `utils/validation` | Form field validators |
| `components/SEO` | Title and meta tag rendering |
| `hooks/useDebounce` | Debounce timing |

---

## E2E Tests (Playwright)

End-to-end tests live in `src/tests/e2e/`. They run against a real backend (Gunicorn) and a real Vite preview build.

Tests are structured around user journeys:

| File | Journey |
|------|---------|
| `home.spec.ts` | Home page loads, navigation works |
| `blog.spec.ts` | List → detail → comment form |
| `contact.spec.ts` | Contact form submit → success message |
| `projects.spec.ts` | Gallery, filter by category |

### Running E2E locally

```bash
# The backend must be running
cd backend && python manage.py runserver &

# Build and preview the frontend
cd src
npm run build
npm run preview &

# Run Playwright
npm run test:e2e
```

Or use the script:

```bash
./scripts/test.sh --e2e
```

### Writing a new E2E test

```typescript
import { test, expect } from '@playwright/test';

test('contact form shows success message', async ({ page }) => {
  await page.goto('/contact');
  await page.fill('[name="name"]', 'Jane Doe');
  await page.fill('[name="email"]', 'jane@example.com');
  await page.selectOption('[name="subject"]', 'general');
  await page.fill('[name="message"]', 'Hello from E2E test');
  await page.click('button[type="submit"]');
  await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
});
```

---

## CI Pipeline

Tests run automatically on every push and pull request via `ci.yml`:

```
push to main / development / test
  ├─ backend job: ruff → bandit → pip-audit → Django check → pytest
  ├─ frontend job: npm audit → eslint → prettier → tsc → vitest → vite build
  └─ e2e job (needs: backend + frontend): gunicorn + vite preview → playwright
```

The `e2e` job only runs after both `backend` and `frontend` jobs pass. All three must be green before a PR can merge to `main`.

---

## Coverage

There is no enforced coverage threshold at this time. The goal is meaningful coverage of critical paths rather than a percentage target. Payment flows, form submissions, and data-mutating endpoints are the priority.

To generate a backend coverage report:

```bash
cd backend
pip install coverage
coverage run manage.py test
coverage html
open htmlcov/index.html
```

Frontend coverage via Vitest:

```bash
cd src
npm run test -- --coverage
open coverage/index.html
```
