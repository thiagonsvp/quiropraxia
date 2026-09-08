import { test, expect } from '@playwright/test';

// A LP é de campanha paga e fica fora do índice orgânico, para não competir com
// giselleguimaraes.com.br. A configuração correta é sutil e fácil de quebrar sem
// querer, então cada peça dela está travada aqui.

test('page is noindex so it does not cannibalise the institutional site', async ({ page }) => {
  await page.goto('/');
  const robots = await page.locator('meta[name="robots"]').getAttribute('content');
  expect(robots).toContain('noindex');
});

test('page keeps a self-referencing canonical for gclid/UTM variants', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    'href',
    'https://quiropraxia.giselleguimaraes.com.br/'
  );
});

test('robots.txt keeps the page crawlable so Google can read the noindex', async ({ request }) => {
  const res = await request.get('/robots.txt');
  expect(res.status()).toBe(200);
  const body = await res.text();

  // Um "Disallow: /" impediria o rastreio e, com isso, a leitura do noindex —
  // a URL poderia continuar indexada. É o erro clássico desta configuração.
  expect(body).not.toMatch(/^\s*Disallow:\s*\/\s*$/m);
  expect(body).toMatch(/^\s*Allow:\s*\/\s*$/m);
});

test('robots.txt grants AdsBot explicit access for ad review', async ({ request }) => {
  const body = await (await request.get('/robots.txt')).text();
  expect(body).toContain('AdsBot-Google');
  expect(body).toContain('AdsBot-Google-Mobile');
});

test('no sitemap is advertised while there is no indexable URL', async ({ request }) => {
  const body = await (await request.get('/robots.txt')).text();
  expect(body).not.toMatch(/^\s*Sitemap:/m);
  expect((await request.get('/sitemap.xml')).status()).toBe(404);
});
