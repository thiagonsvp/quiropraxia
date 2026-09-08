import { test, expect } from '@playwright/test';

test('testimonials section renders one card per testimonial', async ({ page }) => {
  await page.goto('/');
  const testimonials = await page.evaluate(() => window.__testimonials ?? []);
  expect(testimonials.length).toBeGreaterThan(0);

  const section = page.getByTestId('testimonials-section');
  await expect(section).toBeVisible();
  await expect(page.getByTestId('testimonial-card')).toHaveCount(testimonials.length);
});

// Guard-rail: um depoimento sem atribuição é indistinguível de um depoimento
// inventado. Se alguém adicionar um sem `source`, este teste quebra.
test('every testimonial is attributed to a named person and a source', async ({ page }) => {
  await page.goto('/');
  const testimonials = await page.evaluate(() => window.__testimonials ?? []);

  for (const item of testimonials) {
    expect(item.name, `depoimento sem nome: ${item.quote}`).toBeTruthy();
    expect(item.source, `depoimento sem fonte: ${item.quote}`).toBeTruthy();
  }

  const firstCard = page.getByTestId('testimonial-card').first();
  await expect(firstCard).toContainText(testimonials[0].name);
  await expect(firstCard).toContainText(testimonials[0].source);
});

test('testimonials link out to the public Google profile', async ({ page }) => {
  await page.goto('/');
  const link = page.getByTestId('testimonials-section').getByRole('link', { name: /google/i });
  await expect(link).toHaveAttribute('href', /google\.com\/maps\/place/);
});
