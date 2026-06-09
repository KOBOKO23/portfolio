import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
  test('home page loads and shows hero content', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Koboko|Portfolio/i);
    // Hero heading is visible
    await expect(page.locator('h1').first()).toBeVisible();
  });

  test('nav links are present', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('link', { name: /blog/i }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: /projects/i }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: /contact/i }).first()).toBeVisible();
  });

  test('navigates to blog page', async ({ page }) => {
    await page.goto('/blog');
    await expect(page.locator('h1')).toContainText(/ideas|insights|blog|articles/i);
  });

  test('navigates to projects page', async ({ page }) => {
    await page.goto('/projects');
    await expect(page.locator('h1')).toContainText(/projects/i);
  });

  test('navigates to contact page', async ({ page }) => {
    await page.goto('/contact');
    await expect(page.locator('h1')).toContainText(/get in touch|contact/i);
  });

  test('navigates to about page', async ({ page }) => {
    await page.goto('/about');
    await expect(page.locator('h1').first()).toBeVisible();
  });

  test('404 route shows fallback or redirects', async ({ page }) => {
    const response = await page.goto('/this-page-does-not-exist-xyz');
    // SPA will render — just check no crash
    expect(response?.status()).not.toBe(500);
    await expect(page.locator('body')).toBeVisible();
  });
});
