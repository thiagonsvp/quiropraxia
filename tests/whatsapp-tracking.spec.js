import { test, expect } from '@playwright/test';
import { clickAndCapture } from './utils/whatsapp.js';

test('header WhatsApp CTA is correct and tracked', async ({ page, context }) => {
  await page.goto('/');
  const dataLayer = await clickAndCapture(page, context, 'whatsapp-cta-header');
  // objectContaining: o GTM carimba gtm.uniqueEventId no objeto empurrado.
  expect(dataLayer).toContainEqual(
    expect.objectContaining({ event: 'whatsapp_click', click_location: 'header' })
  );
});

test('hero WhatsApp CTA is correct and tracked', async ({ page, context }) => {
  await page.goto('/');
  const dataLayer = await clickAndCapture(page, context, 'whatsapp-cta-hero');
  expect(dataLayer).toContainEqual(
    expect.objectContaining({ event: 'whatsapp_click', click_location: 'hero' })
  );
});

test('hero section shows headline and photo', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Dor lombar, cervical ou ciática');
  await expect(page.getByTestId('hero-photo')).toBeVisible();
});
