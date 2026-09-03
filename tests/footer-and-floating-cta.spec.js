import { test, expect } from '@playwright/test';
import { clickAndCapture } from './utils/whatsapp.js';

test('final CTA WhatsApp button is correct and tracked', async ({ page, context }) => {
  await page.goto('/');
  const dataLayer = await clickAndCapture(page, context, 'whatsapp-cta-final');
  expect(dataLayer).toContainEqual({ event: 'whatsapp_click', click_location: 'final_cta' });
});

test('localização section shows the O2 Corporate address and a map', async ({ page }) => {
  await page.goto('/');
  const section = page.getByTestId('localizacao-section');
  await expect(section).toContainText('O2 Corporate');
  await expect(section).toContainText('Barra da Tijuca');
  await expect(section.locator('iframe')).toHaveCount(1);
});

test('footer includes LGPD notice, Instagram, and email', async ({ page }) => {
  await page.goto('/');
  const footer = page.getByTestId('site-footer');
  await expect(footer).toContainText(/cookies/i);
  await expect(footer.getByRole('link', { name: /instagram/i })).toHaveAttribute(
    'href',
    'https://www.instagram.com/fisio_giselleguimaraes/'
  );
  await expect(footer).toContainText('gisellecguimaraes@yahoo.com.br');
});

test('floating WhatsApp button appears only after scrolling past the hero', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  const floatingCta = page.getByTestId('whatsapp-cta-floating');
  await expect(floatingCta).toBeHidden();

  await page.getByTestId('localizacao-section').scrollIntoViewIfNeeded();
  await expect(floatingCta).toBeVisible();
});
