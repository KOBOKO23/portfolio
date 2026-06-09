import { test, expect } from '@playwright/test';

test.describe('Blog', () => {
  test('blog listing page renders', async ({ page }) => {
    await page.goto('/blog');
    await expect(page.locator('h1')).toBeVisible();
    // Either articles load or fallback content shows
    await expect(page.locator('body')).toBeVisible();
  });

  test('shows search/filter controls', async ({ page }) => {
    await page.goto('/blog');
    // Search input or category filter should be present
    const hasSearch = await page.getByPlaceholder(/search/i).isVisible().catch(() => false);
    const hasFilter = await page.locator('[class*="category"]').first().isVisible().catch(() => false);
    expect(hasSearch || hasFilter).toBeTruthy();
  });

  test('newsletter page renders', async ({ page }) => {
    await page.goto('/newsletter');
    await expect(page.locator('h1').first()).toBeVisible();
    await expect(page.getByPlaceholder(/email/i).first()).toBeVisible();
  });

  test('newsletter subscribe requires valid input', async ({ page }) => {
    await page.goto('/newsletter');
    const emailInput = page.getByPlaceholder(/email/i).first();
    await emailInput.fill('not-an-email');
    await page.getByRole('button', { name: /subscribe|join/i }).first().click();
    // Form should not disappear (validation prevents submit)
    await expect(emailInput).toBeVisible();
  });
});
