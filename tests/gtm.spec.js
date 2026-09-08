import { test, expect } from '@playwright/test';

const CONTAINER_ID = 'GTM-TFFK9VP5';

test('GTM snippet is wired into head and body with the real container id', async ({ page }) => {
  const response = await page.goto('/');
  const html = await response.text();
  expect(html).toContain(`'${CONTAINER_ID}'`);
  expect(html).toContain(`googletagmanager.com/ns.html?id=${CONTAINER_ID}`);
  expect(html).not.toContain('GTM-XXXXXXX');
});

test('GTM container actually loads and initialises the dataLayer', async ({ page }) => {
  const gtmRequest = page.waitForRequest((req) =>
    req.url().includes(`googletagmanager.com/gtm.js?id=${CONTAINER_ID}`)
  );

  await page.goto('/');
  await gtmRequest;

  await expect
    .poll(() => page.evaluate(() => (window.dataLayer ?? []).map((e) => e.event)))
    .toContain('gtm.load');
});
