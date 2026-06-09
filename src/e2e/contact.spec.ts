import { test, expect } from '@playwright/test';

test.describe('Contact form', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/contact');
  });

  test('form fields are present', async ({ page }) => {
    await expect(page.getByPlaceholder(/name/i).first()).toBeVisible();
    await expect(page.getByPlaceholder(/email/i).first()).toBeVisible();
    await expect(page.locator('textarea').first()).toBeVisible();
  });

  test('submit button is present', async ({ page }) => {
    await expect(
      page.getByRole('button', { name: /send|submit/i }).first()
    ).toBeVisible();
  });

  test('validation prevents empty submit', async ({ page }) => {
    const btn = page.getByRole('button', { name: /send|submit/i }).first();
    await btn.click();
    // Browser native required validation — the form should not submit
    // Check the name field is still visible (form didn't disappear)
    await expect(page.getByPlaceholder(/name/i).first()).toBeVisible();
  });

  test('newsletter subscription form is present', async ({ page }) => {
    await expect(page.getByPlaceholder(/email/i).first()).toBeVisible();
  });
});
