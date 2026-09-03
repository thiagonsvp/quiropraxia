import { expect } from '@playwright/test';

export const EXPECTED_TEXT = 'Olá Giselle! Vim pela página de Quiropraxia e gostaria de agendar uma avaliação.';

export function assertWhatsAppHref(href) {
  const url = new URL(href);
  expect(url.hostname).toBe('wa.me');
  expect(url.pathname).toBe('/5521984743764');
  expect(url.searchParams.get('text')).toBe(EXPECTED_TEXT);
}

export async function clickAndCapture(page, context, testId) {
  const cta = page.getByTestId(testId);
  await expect(cta).toBeVisible();
  const href = await cta.getAttribute('href');
  assertWhatsAppHref(href);

  const [popup] = await Promise.all([
    context.waitForEvent('page'),
    cta.click(),
  ]);
  await popup.close();

  return page.evaluate(() => window.dataLayer);
}
