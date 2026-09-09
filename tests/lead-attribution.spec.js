import { test, expect } from '@playwright/test';
import { EXPECTED_TEXT, REF_SUFFIX } from './utils/whatsapp.js';

const REF_IN_TEXT = /\(ref ([23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{6})\)/;

function refOf(href) {
  const text = new URL(href).searchParams.get('text') || '';
  return (text.match(REF_IN_TEXT) || [])[1] ?? null;
}

async function ctaRefs(page) {
  const hrefs = await page.locator('[data-whatsapp-cta]').evaluateAll((els) =>
    els.map((e) => e.href)
  );
  return hrefs.map(refOf);
}

test('every WhatsApp CTA carries an attribution code', async ({ page }) => {
  await page.goto('/');
  const refs = await ctaRefs(page);

  expect(refs.length).toBe(4);
  for (const ref of refs) {
    expect(ref, 'CTA sem código de atribuição').not.toBeNull();
  }
});

test('all CTAs in one visit share the same code', async ({ page }) => {
  await page.goto('/');
  const refs = await ctaRefs(page);

  // Se cada botão tivesse um código diferente, o CRM registraria o mesmo
  // visitante como leads distintos conforme o botão clicado.
  expect(new Set(refs).size).toBe(1);
});

test('the code survives a reload within the same session', async ({ page }) => {
  await page.goto('/');
  const before = (await ctaRefs(page))[0];

  await page.reload();
  const after = (await ctaRefs(page))[0];

  expect(after).toBe(before);
});

test('different sessions get different codes', async ({ browser }) => {
  const a = await browser.newContext();
  const b = await browser.newContext();
  const pageA = await a.newPage();
  const pageB = await b.newPage();

  await pageA.goto('/');
  await pageB.goto('/');
  const [refA] = await ctaRefs(pageA);
  const [refB] = await ctaRefs(pageB);

  expect(refA).not.toBe(refB);
  await a.close();
  await b.close();
});

test('gclid and utm parameters are captured from the ad URL', async ({ page }) => {
  await page.goto('/?gclid=TESTE_GCLID_123&utm_source=google&utm_medium=cpc&utm_campaign=dor-lombar&utm_term=quiropraxia+barra');

  const stored = await page.evaluate(() =>
    JSON.parse(sessionStorage.getItem('gg_lead_attribution'))
  );

  expect(stored.gclid).toBe('TESTE_GCLID_123');
  expect(stored.utm_source).toBe('google');
  expect(stored.utm_campaign).toBe('dor-lombar');
  expect(stored.utm_term).toBe('quiropraxia barra');
  expect(stored.ref).toMatch(/^[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{6}$/);
});

test('the click event carries the code into the dataLayer', async ({ page, context }) => {
  await page.goto('/');
  const [expected] = await ctaRefs(page);

  const [popup] = await Promise.all([
    context.waitForEvent('page'),
    page.getByTestId('whatsapp-cta-hero').click(),
  ]);
  await popup.close();

  const dataLayer = await page.evaluate(() => window.dataLayer);
  expect(dataLayer).toContainEqual(
    expect.objectContaining({ event: 'whatsapp_click', lead_ref: expected })
  );
});

test('the static href works without JavaScript', async ({ browser }) => {
  // Rede de segurança: se o JS falhar, o botão ainda precisa abrir o WhatsApp,
  // mesmo que sem o código de atribuição.
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto('/');

  const href = await page.getByTestId('whatsapp-cta-hero').getAttribute('href');
  const text = new URL(href).searchParams.get('text');

  expect(text).toBe(EXPECTED_TEXT);
  expect(REF_SUFFIX.test(text.slice(EXPECTED_TEXT.length))).toBe(false);
  await context.close();
});

test('no lead is sent to the webhook from a local environment', async ({ page, context }) => {
  // Sem esta trava, cada rodada de testes criaria leads falsos no n8n.
  const calls = [];
  context.on('request', (r) => {
    if (r.url().includes('/webhook/')) calls.push(r.url());
  });

  await page.goto('/');
  const [popup] = await Promise.all([
    context.waitForEvent('page'),
    page.getByTestId('whatsapp-cta-hero').click(),
  ]);
  await popup.close();
  await page.waitForTimeout(1500);

  expect(calls, `webhook chamado a partir do ambiente local: ${calls}`).toHaveLength(0);
});
