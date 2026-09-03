import { test, expect } from '@playwright/test';

test('page loads with correct title and design tokens', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle('Quiropraxia com Giselle Guimarães | Barra da Tijuca, RJ');

  const tokens = await page.evaluate(() => {
    const style = getComputedStyle(document.documentElement);
    return {
      navy: style.getPropertyValue('--color-navy').trim(),
      navyDark: style.getPropertyValue('--color-navy-dark').trim(),
      lime: style.getPropertyValue('--color-lime').trim(),
      coral: style.getPropertyValue('--color-coral').trim(),
    };
  });

  expect(tokens.navy).toBe('#12213b');
  expect(tokens.navyDark).toBe('#0e1b33');
  expect(tokens.lime).toBe('#c7f464');
  expect(tokens.coral).toBe('#ff5a5f');
});
