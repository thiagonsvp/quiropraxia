import { test, expect } from '@playwright/test';

test('GTM snippet is wired into head and body', async ({ page }) => {
  const response = await page.goto('/');
  const html = await response.text();
  expect(html).toContain('googletagmanager.com/gtm.js?id=GTM-');
  expect(html).toContain('googletagmanager.com/ns.html?id=GTM-');
});
