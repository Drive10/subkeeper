import { test, expect } from '@playwright/test';

test.describe('Subscriptions', () => {
  test('should redirect to login when not authenticated', async ({ page }) => {
    await page.goto('/subscriptions');
    await expect(page).toHaveURL(/login/);
  });

  test('should show login page when accessing protected route', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/login/);
  });
});