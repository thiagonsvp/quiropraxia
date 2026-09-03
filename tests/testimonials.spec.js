import { test, expect } from '@playwright/test';

test('testimonials section is hidden while no real testimonials exist', async ({ page }) => {
  await page.goto('/');
  const testimonialsCount = await page.evaluate(() => window.__testimonials?.length ?? -1);
  expect(testimonialsCount).toBe(0);

  const section = page.getByTestId('testimonials-section');
  await expect(section).toBeHidden();
});
