import { expect } from '@playwright/test';

export const EXPECTED_TEXT = 'Olá Giselle! Vim pela página de Quiropraxia e gostaria de agendar uma avaliação.';

// O código de atribuição é acrescentado pelo JS. O href estático do HTML não o
// tem — é o fallback de quando o JS falha —, então o sufixo é opcional aqui.
export const REF_SUFFIX = /^ \(ref [23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{6}\)$/;

export function assertWhatsAppHref(href) {
  const url = new URL(href);
  expect(url.hostname).toBe('wa.me');
  expect(url.pathname).toBe('/5521984743764');

  const text = url.searchParams.get('text');
  expect(text.startsWith(EXPECTED_TEXT), `mensagem inesperada: ${text}`).toBe(true);

  const suffix = text.slice(EXPECTED_TEXT.length);
  expect(suffix === '' || REF_SUFFIX.test(suffix), `sufixo inválido: ${suffix}`).toBe(true);
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
