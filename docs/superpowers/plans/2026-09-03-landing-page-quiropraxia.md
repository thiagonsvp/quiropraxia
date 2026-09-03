# Landing Page de Quiropraxia (Giselle Guimarães) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a standalone, conversion-focused, one-page chiropractic landing site for Giselle Guimarães, deployed on Vercel under `quiropraxia.giselleguimaraes.com.br`, with GTM/GA4/Google Ads conversion tracking wired to every WhatsApp CTA.

**Architecture:** A single static `index.html` + `css/styles.css` + `js/main.js`, no framework, no build step for production. Development uses a tiny zero-dependency Node static server and Playwright tests (dev-only tooling) to verify markup, tracking behavior, and asset weight before every commit.

**Tech Stack:** HTML5, CSS3, vanilla JS, Python 3 + Pillow (one-off image optimization), Node.js + `@playwright/test` (dev/test only), Vercel (hosting), Google Tag Manager, GA4, Google Ads.

**Spec:** `docs/superpowers/specs/2026-09-03-landing-page-quiropraxia-design.md`

## Global Constraints

- No framework, no CMS, no build step for the shipped site — plain HTML/CSS/JS only.
- No contact form, no click-to-call — the only conversion path is WhatsApp.
- No prices or price ranges displayed anywhere on the page.
- No discount/promotional offer — copy sells authority and trust, not promotion.
- WhatsApp number for all CTAs: `5521984743764` (E.164, no `+`, no spaces) — international format `+55 21 98474-3764`.
- WhatsApp prefilled message (identical on every CTA): `Olá Giselle! Vim pela página de Quiropraxia e gostaria de agendar uma avaliação.`
- Domain: `quiropraxia.giselleguimaraes.com.br`, DNS managed on Hostinger hPanel, pointing to Vercel.
- Instagram: `@fisio_giselleguimaraes` → `https://www.instagram.com/fisio_giselleguimaraes/`
- E-mail: `gisellecguimaraes@yahoo.com.br`
- Palette: `--color-navy: #12213b`, `--color-navy-dark: #0e1b33`, `--color-lime: #c7f464`, `--color-coral: #ff5a5f`, `--color-white: #ffffff`, `--color-gray-100: #e7eaf0`.
- Typography: `Sora` for headings, `Inter` for body text (Google Fonts).
- Hero layout: split — copy + CTA on the left, photo on the right (stacked on mobile).
- Images: WebP with JPEG fallback, `loading="lazy"` on everything below the fold.
- No absolute medical claims ("cura garantida", "elimina a dor para sempre", etc.) anywhere in copy — Google Ads health-content policy risk.
- Tracking: the site code only ever does `window.dataLayer.push(...)`. All conversion logic (which events count as a Google Ads conversion) is configured inside GTM, never hardcoded in the page.
- LGPD: a short footer notice about analytics/ads cookies — no consent-management banner.

---

### Task 1: Project scaffold, design tokens, and test harness

**Files:**
- Create: `package.json`
- Create: `playwright.config.js`
- Create: `tools/dev-server.mjs`
- Create: `index.html`
- Create: `css/styles.css`
- Create: `tests/scaffold.spec.js`
- Modify: `.gitignore`

**Interfaces:**
- Consumes: nothing (first task).
- Produces: CSS custom properties `--color-navy`, `--color-navy-dark`, `--color-lime`, `--color-coral`, `--color-white`, `--color-gray-100`, `--font-heading`, `--font-body` on `:root`, defined exactly as in Global Constraints. `.container` utility class (max-width 1180px, centered, 24px side padding). Page `<title>` = `Quiropraxia com Giselle Guimarães | Barra da Tijuca, RJ`. A `<main id="main-content">` element that every later task appends sections into. A `js/main.js` file (created empty in this task, populated starting Task 3) loaded via `<script src="js/main.js" defer></script>` at the end of `<body>`.

- [ ] **Step 1: Create the zero-dependency dev server**

Create `tools/dev-server.mjs`:

```js
import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join } from 'node:path';

const ROOT = process.cwd();
const PORT = process.env.PORT || 4173;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.webp': 'image/webp',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
};

const server = http.createServer(async (req, res) => {
  const urlPath = req.url === '/' ? '/index.html' : req.url.split('?')[0];
  const filePath = join(ROOT, decodeURIComponent(urlPath));
  try {
    const data = await readFile(filePath);
    res.writeHead(200, { 'Content-Type': MIME[extname(filePath)] || 'application/octet-stream' });
    res.end(data);
  } catch {
    res.writeHead(404);
    res.end('Not found');
  }
});

server.listen(PORT, () => console.log(`dev server on http://localhost:${PORT}`));
```

- [ ] **Step 2: Create `package.json` and install Playwright**

Create `package.json`:

```json
{
  "name": "giselle-quiropraxia-landing",
  "private": true,
  "version": "1.0.0",
  "scripts": {
    "test": "playwright test"
  },
  "devDependencies": {
    "@playwright/test": "^1.48.0"
  }
}
```

Run: `npm install && npx playwright install chromium`
Expected: dependencies install cleanly, Chromium downloads without error.

- [ ] **Step 3: Create Playwright config**

Create `playwright.config.js`:

```js
// @ts-check
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  webServer: {
    command: 'node tools/dev-server.mjs',
    url: 'http://localhost:4173',
    reuseExistingServer: !process.env.CI,
  },
  use: {
    baseURL: 'http://localhost:4173',
  },
});
```

- [ ] **Step 4: Write the failing scaffold test**

Create `tests/scaffold.spec.js`:

```js
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
```

- [ ] **Step 5: Run test to verify it fails**

Run: `npx playwright test tests/scaffold.spec.js`
Expected: FAIL — `index.html` / `css/styles.css` don't exist yet, so the dev server 404s and the title/token assertions fail.

- [ ] **Step 6: Implement the minimal HTML shell**

Create `index.html`:

```html
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Quiropraxia com Giselle Guimarães | Barra da Tijuca, RJ</title>
  <meta name="description" content="Alívio para dor lombar, cervical, ciática e postural com quiropraxia especializada. Atendimento humanizado na Barra da Tijuca. Agende pelo WhatsApp.">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Sora:wght@600;700;800&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="css/styles.css">
</head>
<body>
  <main id="main-content"></main>
  <script src="js/main.js" defer></script>
</body>
</html>
```

Create empty `js/main.js`:

```js
// Populated starting Task 3: WhatsApp click tracking + interactive behavior.
```

- [ ] **Step 7: Implement the design tokens**

Create `css/styles.css`:

```css
:root {
  --color-navy: #12213b;
  --color-navy-dark: #0e1b33;
  --color-lime: #c7f464;
  --color-coral: #ff5a5f;
  --color-white: #ffffff;
  --color-gray-100: #e7eaf0;

  --font-heading: 'Sora', system-ui, sans-serif;
  --font-body: 'Inter', system-ui, sans-serif;

  --container-max: 1180px;
}

* {
  box-sizing: border-box;
}

html, body {
  margin: 0;
  padding: 0;
}

body {
  font-family: var(--font-body);
  color: var(--color-navy);
  background: var(--color-white);
  line-height: 1.5;
}

h1, h2, h3 {
  font-family: var(--font-heading);
  margin: 0 0 0.5em;
  line-height: 1.2;
}

img {
  max-width: 100%;
  display: block;
}

a {
  color: inherit;
}

.container {
  max-width: var(--container-max);
  margin: 0 auto;
  padding: 0 24px;
}
```

- [ ] **Step 8: Run test to verify it passes**

Run: `npx playwright test tests/scaffold.spec.js`
Expected: PASS (1 passed).

- [ ] **Step 9: Update `.gitignore` and commit**

Append to `.gitignore`:

```
node_modules/
test-results/
playwright-report/
```

Run:
```bash
git add package.json playwright.config.js tools/dev-server.mjs index.html css/styles.css js/main.js tests/scaffold.spec.js .gitignore package-lock.json
git commit -m "feat: scaffold static site with design tokens and Playwright harness"
```

---

### Task 2: Image asset optimization

**Files:**
- Create: `tools/optimize-images.py`
- Create: `img/hero-giselle.webp`, `img/hero-giselle.jpg`
- Create: `img/metodo-giselle.webp`, `img/metodo-giselle.jpg`
- Create: `img/sobre-giselle.webp`, `img/sobre-giselle.jpg`
- Create: `tests/assets.spec.js`

**Interfaces:**
- Consumes: source photos already committed at repo root — `WhatsApp Image 2026-09-03 at 14.21.11 (1).jpeg` (hero), `WhatsApp Image 2026-09-03 at 14.21.12.jpeg` (método), `WhatsApp Image 2026-09-03 at 14.21.12 (2).jpeg` (sobre).
- Produces: `img/hero-giselle.{webp,jpg}`, `img/metodo-giselle.{webp,jpg}`, `img/sobre-giselle.{webp,jpg}` — filenames later tasks reference directly in `<picture>` elements.

- [ ] **Step 1: Write the failing asset-weight test**

Create `tests/assets.spec.js`:

```js
import { test, expect } from '@playwright/test';
import { statSync } from 'node:fs';

const MAX_BYTES = { webp: 300_000, jpg: 400_000 };

const files = [
  'img/hero-giselle.webp',
  'img/hero-giselle.jpg',
  'img/metodo-giselle.webp',
  'img/metodo-giselle.jpg',
  'img/sobre-giselle.webp',
  'img/sobre-giselle.jpg',
];

for (const file of files) {
  test(`${file} exists and stays under the size budget`, () => {
    const stats = statSync(file);
    const ext = file.endsWith('.webp') ? 'webp' : 'jpg';
    expect(stats.size).toBeGreaterThan(0);
    expect(stats.size).toBeLessThanOrEqual(MAX_BYTES[ext]);
  });
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx playwright test tests/assets.spec.js`
Expected: FAIL — none of the `img/*` files exist yet (`ENOENT`).

- [ ] **Step 3: Install Pillow and write the optimization script**

Run: `pip install --user Pillow`

Create `tools/optimize-images.py`:

```python
from pathlib import Path
from PIL import Image

BASE = Path(__file__).resolve().parent.parent

SOURCES = {
    "img/hero-giselle": "WhatsApp Image 2026-09-03 at 14.21.11 (1).jpeg",
    "img/metodo-giselle": "WhatsApp Image 2026-09-03 at 14.21.12.jpeg",
    "img/sobre-giselle": "WhatsApp Image 2026-09-03 at 14.21.12 (2).jpeg",
}


def main():
    img_dir = BASE / "img"
    img_dir.mkdir(exist_ok=True)
    for dest_stem, source_name in SOURCES.items():
        source_path = BASE / source_name
        im = Image.open(source_path).convert("RGB")
        webp_path = BASE / f"{dest_stem}.webp"
        jpg_path = BASE / f"{dest_stem}.jpg"
        im.save(webp_path, "WEBP", quality=78, method=6)
        im.save(jpg_path, "JPEG", quality=82, optimize=True)
        print(
            f"{source_name} -> {webp_path.name} "
            f"({webp_path.stat().st_size // 1024} KB), "
            f"{jpg_path.name} ({jpg_path.stat().st_size // 1024} KB)"
        )


if __name__ == "__main__":
    main()
```

- [ ] **Step 4: Run the script**

Run: `python tools/optimize-images.py`
Expected: prints six output lines, one pair per source photo, each under the budget from Step 1 (WebP typically 60–150 KB, JPEG 120–300 KB for these ~1.1MP portraits/landscape).

- [ ] **Step 5: Run test to verify it passes**

Run: `npx playwright test tests/assets.spec.js`
Expected: PASS (6 passed). If any file exceeds its budget, lower that format's `quality` value in the script by 5–10 and re-run Steps 4–5.

- [ ] **Step 6: Commit**

```bash
git add tools/optimize-images.py img/hero-giselle.webp img/hero-giselle.jpg img/metodo-giselle.webp img/metodo-giselle.jpg img/sobre-giselle.webp img/sobre-giselle.jpg tests/assets.spec.js
git commit -m "feat: add optimized WebP/JPEG image pairs for hero, method, and about sections"
```

---

### Task 3: Header + Hero section with WhatsApp click tracking

**Files:**
- Modify: `index.html`
- Modify: `css/styles.css`
- Modify: `js/main.js`
- Create: `tests/utils/whatsapp.js`
- Create: `tests/whatsapp-tracking.spec.js`

**Interfaces:**
- Consumes: design tokens from Task 1 (`--color-navy`, `--color-lime`, etc.), `img/hero-giselle.webp`/`.jpg` from Task 2.
- Produces: the WhatsApp-tracking contract every later CTA must follow — any element with `data-whatsapp-cta` and `data-location="<location>"` automatically gets its click pushed to `window.dataLayer` as `{ event: 'whatsapp_click', click_location: '<location>' }`. Test-id convention: `whatsapp-cta-<location>` (e.g. `whatsapp-cta-hero`). The delegated click handler lives in `js/main.js` and requires no changes when later tasks add more CTAs — they just need the two `data-*` attributes. Also produces the shared test helper `tests/utils/whatsapp.js`, exporting `EXPECTED_TEXT`, `assertWhatsAppHref(href)`, and `clickAndCapture(page, context, testId)` — **Task 8's final-CTA test must import this helper instead of redefining it.**

- [ ] **Step 1: Write the shared WhatsApp test helper**

Create `tests/utils/whatsapp.js`:

```js
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
```

- [ ] **Step 2: Write the failing header + hero test**

Create `tests/whatsapp-tracking.spec.js`:

```js
import { test, expect } from '@playwright/test';
import { clickAndCapture } from './utils/whatsapp.js';

test('header WhatsApp CTA is correct and tracked', async ({ page, context }) => {
  await page.goto('/');
  const dataLayer = await clickAndCapture(page, context, 'whatsapp-cta-header');
  expect(dataLayer).toContainEqual({ event: 'whatsapp_click', click_location: 'header' });
});

test('hero WhatsApp CTA is correct and tracked', async ({ page, context }) => {
  await page.goto('/');
  const dataLayer = await clickAndCapture(page, context, 'whatsapp-cta-hero');
  expect(dataLayer).toContainEqual({ event: 'whatsapp_click', click_location: 'hero' });
});

test('hero section shows headline and photo', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Dor lombar, cervical ou ciática');
  await expect(page.getByTestId('hero-photo')).toBeVisible();
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx playwright test tests/whatsapp-tracking.spec.js`
Expected: FAIL — no header/hero markup exists yet.

- [ ] **Step 4: Implement the delegated tracking handler**

Replace the contents of `js/main.js`:

```js
window.dataLayer = window.dataLayer || [];

document.addEventListener('click', (event) => {
  const cta = event.target.closest('[data-whatsapp-cta]');
  if (!cta) return;
  window.dataLayer.push({
    event: 'whatsapp_click',
    click_location: cta.dataset.location,
  });
});
```

- [ ] **Step 5: Implement the header + hero markup**

Inside `index.html`, replace `<main id="main-content"></main>` with:

```html
<main id="main-content">
  <header class="site-header">
    <div class="container site-header__inner">
      <span class="site-header__brand">Giselle Guimarães</span>
      <a
        class="btn btn--lime"
        data-testid="whatsapp-cta-header"
        data-whatsapp-cta
        data-location="header"
        target="_blank"
        rel="noopener"
        href="https://wa.me/5521984743764?text=Ol%C3%A1%20Giselle!%20Vim%20pela%20p%C3%A1gina%20de%20Quiropraxia%20e%20gostaria%20de%20agendar%20uma%20avalia%C3%A7%C3%A3o."
      >Agendar no WhatsApp</a>
    </div>
  </header>

  <section class="hero">
    <div class="container hero__inner">
      <div class="hero__copy">
        <h1>Dor lombar, cervical ou ciática atrapalhando seu dia a dia?</h1>
        <p class="hero__subheadline">
          Cuide da sua coluna com quiropraxia especializada, em um atendimento que une
          técnica e acolhimento — na Barra da Tijuca.
        </p>
        <a
          class="btn btn--lime btn--large"
          data-testid="whatsapp-cta-hero"
          data-whatsapp-cta
          data-location="hero"
          target="_blank"
          rel="noopener"
          href="https://wa.me/5521984743764?text=Ol%C3%A1%20Giselle!%20Vim%20pela%20p%C3%A1gina%20de%20Quiropraxia%20e%20gostaria%20de%20agendar%20uma%20avalia%C3%A7%C3%A3o."
        >Agendar avaliação no WhatsApp</a>
      </div>
      <picture>
        <source srcset="img/hero-giselle.webp" type="image/webp">
        <img
          data-testid="hero-photo"
          class="hero__photo"
          src="img/hero-giselle.jpg"
          alt="Giselle Guimarães, fisioterapeuta especialista em quiropraxia, em seu consultório"
          width="854"
          height="1280"
        >
      </picture>
    </div>
  </section>
</main>
```

- [ ] **Step 6: Add header/hero styles**

Append to `css/styles.css`:

```css
.btn {
  display: inline-block;
  padding: 12px 20px;
  border-radius: 8px;
  font-family: var(--font-heading);
  font-weight: 700;
  text-decoration: none;
  cursor: pointer;
  border: none;
}

.btn--lime {
  background: var(--color-lime);
  color: var(--color-navy-dark);
}

.btn--large {
  padding: 16px 28px;
  font-size: 1.1rem;
}

.site-header {
  position: sticky;
  top: 0;
  z-index: 10;
  background: var(--color-white);
  border-bottom: 1px solid var(--color-gray-100);
}

.site-header__inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 14px;
  padding-bottom: 14px;
}

.site-header__brand {
  font-family: var(--font-heading);
  font-weight: 700;
}

.hero {
  background: var(--color-navy-dark);
  color: var(--color-white);
  padding: 56px 0;
}

.hero__inner {
  display: flex;
  flex-direction: column-reverse;
  gap: 32px;
  align-items: center;
}

.hero__copy {
  flex: 1;
}

.hero__subheadline {
  font-size: 1.1rem;
  opacity: 0.9;
}

.hero__photo {
  border-radius: 12px;
  max-width: 360px;
}

@media (min-width: 900px) {
  .hero__inner {
    flex-direction: row;
    align-items: center;
  }

  .hero__photo {
    max-width: 420px;
  }
}
```

- [ ] **Step 7: Run test to verify it passes**

Run: `npx playwright test tests/whatsapp-tracking.spec.js tests/scaffold.spec.js`
Expected: PASS (4 passed).

- [ ] **Step 8: Commit**

```bash
git add index.html css/styles.css js/main.js tests/utils/whatsapp.js tests/whatsapp-tracking.spec.js
git commit -m "feat: add header and hero with WhatsApp click tracking"
```

---

### Task 4: Trust bar + "Você sente isso?" symptom section

**Files:**
- Modify: `index.html`
- Modify: `css/styles.css`
- Create: `tests/content-sections.spec.js`

**Interfaces:**
- Consumes: `.container` utility and design tokens from Task 1.
- Produces: `data-testid="trust-bar"` and `data-testid="symptom-item"` (4 elements) for later tests/tasks to reference if needed.

- [ ] **Step 1: Write the failing test**

Create `tests/content-sections.spec.js`:

```js
import { test, expect } from '@playwright/test';

test('trust bar shows confirmed credentials', async ({ page }) => {
  await page.goto('/');
  const trustBar = page.getByTestId('trust-bar');
  await expect(trustBar).toContainText('Universidade Veiga de Almeida');
  await expect(trustBar).toContainText('Especialista em Quiropraxia');
  await expect(trustBar).toContainText('O2 Corporate');
});

test('symptom checklist lists all four target complaints', async ({ page }) => {
  await page.goto('/');
  const items = page.getByTestId('symptom-item');
  await expect(items).toHaveCount(4);
  await expect(items.nth(0)).toContainText('lombar');
  await expect(items.nth(1)).toContainText('cervical');
  await expect(items.nth(2)).toContainText('ciática');
  await expect(items.nth(3)).toContainText('Postura');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx playwright test tests/content-sections.spec.js`
Expected: FAIL — sections don't exist yet.

- [ ] **Step 3: Implement the markup**

Inside `index.html`, immediately after the closing `</section>` of `.hero`, add:

```html
<section class="trust-bar" data-testid="trust-bar">
  <div class="container trust-bar__inner">
    <span>Fisioterapeuta — Universidade Veiga de Almeida</span>
    <span>Especialista em Quiropraxia</span>
    <span>Atendimento no O2 Corporate &amp; Offices</span>
  </div>
</section>

<section class="symptoms">
  <div class="container">
    <h2>Você sente isso?</h2>
    <div class="symptoms__grid">
      <div class="symptom-card" data-testid="symptom-item">
        <h3>Dor lombar / coluna</h3>
        <p>Aquela dor que trava as costas e dificulta até levantar da cama.</p>
      </div>
      <div class="symptom-card" data-testid="symptom-item">
        <h3>Dor cervical / torcicolo</h3>
        <p>Tensão no pescoço que vira dor de cabeça e incomoda o dia inteiro.</p>
      </div>
      <div class="symptom-card" data-testid="symptom-item">
        <h3>Dor ciática / irradiada</h3>
        <p>Dor que sai da lombar e desce pela perna, incomodando ao sentar ou caminhar.</p>
      </div>
      <div class="symptom-card" data-testid="symptom-item">
        <h3>Postura e home office</h3>
        <p>Horas sentado(a) cobrando um preço: ombros tensos, coluna desalinhada, cansaço constante.</p>
      </div>
    </div>
  </div>
</section>
```

- [ ] **Step 4: Add styles**

Append to `css/styles.css`:

```css
.trust-bar {
  background: var(--color-gray-100);
  padding: 16px 0;
  font-size: 0.9rem;
  font-weight: 600;
}

.trust-bar__inner {
  display: flex;
  flex-wrap: wrap;
  gap: 12px 28px;
  justify-content: center;
}

.symptoms {
  padding: 56px 0;
}

.symptoms__grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 20px;
  margin-top: 24px;
}

.symptom-card {
  border: 1px solid var(--color-gray-100);
  border-radius: 12px;
  padding: 20px;
}

@media (min-width: 700px) {
  .symptoms__grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx playwright test tests/content-sections.spec.js`
Expected: PASS (2 passed).

- [ ] **Step 6: Commit**

```bash
git add index.html css/styles.css tests/content-sections.spec.js
git commit -m "feat: add trust bar and symptom checklist sections"
```

**Follow-up (not part of this plan's automated tasks):** the trust bar intentionally omits a CREFITO registration badge — we don't have the number yet. Once Giselle provides it, add a fourth `<span>CREFITO ####</span>` to `.trust-bar__inner` in `index.html`.

---

### Task 5: "Como funciona a quiropraxia" + Diferenciais

**Files:**
- Modify: `index.html`
- Modify: `css/styles.css`
- Modify: `img/metodo-giselle.webp`, `img/metodo-giselle.jpg` (already exist — referenced here for the first time)
- Modify: `tests/content-sections.spec.js`

**Interfaces:**
- Consumes: `img/metodo-giselle.{webp,jpg}` from Task 2.
- Produces: `data-testid="metodo-step"` (3 elements), `data-testid="diferencial-item"` (3 elements).

- [ ] **Step 1: Add failing tests**

Append to `tests/content-sections.spec.js`:

```js
test('"como funciona" explains the 3-step method', async ({ page }) => {
  await page.goto('/');
  const steps = page.getByTestId('metodo-step');
  await expect(steps).toHaveCount(3);
  await expect(steps.nth(0)).toContainText('Avaliação');
  await expect(steps.nth(1)).toContainText('Plano de tratamento');
  await expect(steps.nth(2)).toContainText('Ajustes');
});

test('diferenciais section lists the three key differentiators', async ({ page }) => {
  await page.goto('/');
  const items = page.getByTestId('diferencial-item');
  await expect(items).toHaveCount(3);
  await expect(items.nth(0)).toContainText('O2 Corporate');
  await expect(items.nth(2)).toContainText('acolhimento');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx playwright test tests/content-sections.spec.js`
Expected: FAIL on the two new tests (3 passed, 2 failed).

- [ ] **Step 3: Implement the markup**

Inside `index.html`, immediately after the `.symptoms` section's closing `</section>`, add:

```html
<section class="metodo">
  <div class="container metodo__inner">
    <picture>
      <source srcset="img/metodo-giselle.webp" type="image/webp">
      <img
        src="img/metodo-giselle.jpg"
        alt="Giselle Guimarães explicando um ajuste quiroprático em um modelo de coluna"
        width="854"
        height="1280"
        loading="lazy"
        class="metodo__photo"
      >
    </picture>
    <div>
      <h2>Como funciona a quiropraxia</h2>
      <ol class="metodo__steps">
        <li data-testid="metodo-step">
          <h3>1. Avaliação</h3>
          <p>Giselle analisa sua postura, histórico e queixas para entender a origem da dor.</p>
        </li>
        <li data-testid="metodo-step">
          <h3>2. Plano de tratamento</h3>
          <p>Um plano de ajustes pensado para o seu corpo e sua rotina, não um protocolo genérico.</p>
        </li>
        <li data-testid="metodo-step">
          <h3>3. Ajustes e acompanhamento</h3>
          <p>Sessões de quiropraxia com acompanhamento da evolução a cada etapa.</p>
        </li>
      </ol>
    </div>
  </div>
</section>

<section class="diferenciais">
  <div class="container">
    <h2>Diferenciais</h2>
    <ul class="diferenciais__list">
      <li data-testid="diferencial-item">Ambiente moderno e seguro no O2 Corporate &amp; Offices, na Barra da Tijuca.</li>
      <li data-testid="diferencial-item">Atendimento individualizado — sem pressa, sem protocolo padronizado.</li>
      <li data-testid="diferencial-item">Uma abordagem que une técnica e acolhimento em cada sessão.</li>
    </ul>
  </div>
</section>
```

- [ ] **Step 4: Add styles**

Append to `css/styles.css`:

```css
.metodo {
  padding: 56px 0;
  background: var(--color-gray-100);
}

.metodo__inner {
  display: grid;
  grid-template-columns: 1fr;
  gap: 32px;
  align-items: center;
}

.metodo__photo {
  border-radius: 12px;
  max-width: 320px;
  margin: 0 auto;
}

.metodo__steps {
  list-style: none;
  padding: 0;
  margin: 24px 0 0;
  display: grid;
  gap: 20px;
}

.diferenciais {
  padding: 56px 0;
}

.diferenciais__list {
  margin-top: 24px;
  padding-left: 20px;
  display: grid;
  gap: 16px;
  font-size: 1.05rem;
}

@media (min-width: 900px) {
  .metodo__inner {
    grid-template-columns: 320px 1fr;
  }
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx playwright test tests/content-sections.spec.js`
Expected: PASS (4 passed).

- [ ] **Step 6: Commit**

```bash
git add index.html css/styles.css tests/content-sections.spec.js
git commit -m "feat: add como-funciona method steps and diferenciais sections"
```

---

### Task 6: "Sobre a Giselle" + data-driven Depoimentos (graceful empty state)

**Files:**
- Modify: `index.html`
- Modify: `css/styles.css`
- Modify: `js/main.js`
- Create: `tests/testimonials.spec.js`
- Modify: `tests/content-sections.spec.js`

**Interfaces:**
- Consumes: `img/sobre-giselle.{webp,jpg}` from Task 2, `.container` tokens from Task 1.
- Produces: a `testimonials` array and `renderTestimonials(testimonials)` function in `js/main.js`. `data-testid="testimonials-section"` — hidden via the `hidden` attribute whenever `testimonials.length === 0`. **This section must stay empty (and therefore hidden) until Giselle sends real chiropractic-patient testimonials — do not fabricate quotes.**

- [ ] **Step 1: Write the failing "sobre" test**

Append to `tests/content-sections.spec.js`:

```js
test('"sobre" section introduces Giselle', async ({ page }) => {
  await page.goto('/');
  const sobre = page.getByTestId('sobre-section');
  await expect(sobre).toContainText('Universidade Veiga de Almeida');
  await expect(sobre.getByRole('img')).toBeVisible();
});
```

- [ ] **Step 2: Write the failing testimonials test**

Create `tests/testimonials.spec.js`:

```js
import { test, expect } from '@playwright/test';

test('testimonials section is hidden while no real testimonials exist', async ({ page }) => {
  await page.goto('/');
  const testimonialsCount = await page.evaluate(() => window.__testimonials?.length ?? -1);
  expect(testimonialsCount).toBe(0);

  const section = page.getByTestId('testimonials-section');
  await expect(section).toBeHidden();
});
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `npx playwright test tests/content-sections.spec.js tests/testimonials.spec.js`
Expected: FAIL — no "sobre" markup, no `window.__testimonials`, no testimonials section.

- [ ] **Step 4: Implement the "sobre" markup**

Inside `index.html`, immediately after the `.diferenciais` section's closing `</section>`, add:

```html
<section class="sobre" data-testid="sobre-section">
  <div class="container sobre__inner">
    <picture>
      <source srcset="img/sobre-giselle.webp" type="image/webp">
      <img
        src="img/sobre-giselle.jpg"
        alt="Giselle Guimarães trabalhando em seu consultório na Barra da Tijuca"
        width="1280"
        height="854"
        loading="lazy"
        class="sobre__photo"
      >
    </picture>
    <div>
      <h2>Sobre a Giselle</h2>
      <p>
        Fisioterapeuta formada pela Universidade Veiga de Almeida, Giselle Guimarães é
        especialista em quiropraxia e Pilates. Atende na Barra da Tijuca com um método que
        combina rigor técnico e um cuidado próximo com cada paciente — "movimento com
        técnica e acolhimento", como ela mesma resume seu trabalho.
      </p>
    </div>
  </div>
</section>

<section class="testimonials" data-testid="testimonials-section" hidden>
  <div class="container">
    <h2>Depoimentos</h2>
    <div class="testimonials__grid" id="testimonials-grid"></div>
  </div>
</section>
```

- [ ] **Step 5: Implement the data-driven render function**

Append to `js/main.js`:

```js
const testimonials = [];
window.__testimonials = testimonials;

function renderTestimonials(items) {
  const section = document.querySelector('[data-testid="testimonials-section"]');
  const grid = document.getElementById('testimonials-grid');
  if (!section || !grid) return;

  if (items.length === 0) {
    section.hidden = true;
    return;
  }

  section.hidden = false;
  grid.innerHTML = '';
  for (const item of items) {
    const card = document.createElement('blockquote');
    card.className = 'testimonial-card';
    card.innerHTML = `<p>&ldquo;${item.quote}&rdquo;</p><cite>${item.name}</cite>`;
    grid.appendChild(card);
  }
}

renderTestimonials(testimonials);
```

- [ ] **Step 6: Add styles**

Append to `css/styles.css`:

```css
.sobre {
  padding: 56px 0;
}

.sobre__inner {
  display: grid;
  grid-template-columns: 1fr;
  gap: 32px;
  align-items: center;
}

.sobre__photo {
  border-radius: 12px;
}

.testimonials {
  padding: 56px 0;
  background: var(--color-gray-100);
}

.testimonials__grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 20px;
  margin-top: 24px;
}

.testimonial-card {
  background: var(--color-white);
  border-radius: 12px;
  padding: 20px;
  margin: 0;
}

@media (min-width: 900px) {
  .sobre__inner {
    grid-template-columns: 420px 1fr;
  }

  .testimonials__grid {
    grid-template-columns: repeat(3, 1fr);
  }
}
```

- [ ] **Step 7: Run tests to verify they pass**

Run: `npx playwright test tests/content-sections.spec.js tests/testimonials.spec.js`
Expected: PASS (6 passed) — 5 in `content-sections.spec.js` (2 from Task 4, 2 from Task 5, 1 new "sobre" test) plus 1 in `testimonials.spec.js`.

- [ ] **Step 8: Commit**

```bash
git add index.html css/styles.css js/main.js tests/content-sections.spec.js tests/testimonials.spec.js
git commit -m "feat: add sobre section and data-driven testimonials with graceful empty state"
```

**Follow-up (not part of this plan's automated tasks):** once Giselle sends real chiropractic-patient testimonials, add them as `{ quote, name }` objects to the `testimonials` array in `js/main.js` — the section will render and unhide automatically.

---

### Task 7: FAQ accordion

**Files:**
- Modify: `index.html`
- Modify: `css/styles.css`
- Modify: `js/main.js`
- Create: `tests/faq.spec.js`

**Interfaces:**
- Consumes: nothing new.
- Produces: `data-testid="faq-question"` (3 buttons) and `data-testid="faq-answer-N"` (N = 0,1,2) for later reference. `aria-expanded` on each question button reflects open/closed state.

- [ ] **Step 1: Write the failing test**

Create `tests/faq.spec.js`:

```js
import { test, expect } from '@playwright/test';

test('FAQ accordion toggles each answer independently', async ({ page }) => {
  await page.goto('/');
  const questions = page.getByTestId('faq-question');
  await expect(questions).toHaveCount(3);

  const firstAnswer = page.getByTestId('faq-answer-0');
  await expect(firstAnswer).toBeHidden();
  await expect(questions.nth(0)).toHaveAttribute('aria-expanded', 'false');

  await questions.nth(0).click();
  await expect(firstAnswer).toBeVisible();
  await expect(questions.nth(0)).toHaveAttribute('aria-expanded', 'true');

  await questions.nth(0).click();
  await expect(firstAnswer).toBeHidden();
  await expect(questions.nth(0)).toHaveAttribute('aria-expanded', 'false');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx playwright test tests/faq.spec.js`
Expected: FAIL — no FAQ markup exists.

- [ ] **Step 3: Implement the markup**

Inside `index.html`, immediately after the `.testimonials` section's closing `</section>`, add:

```html
<section class="faq">
  <div class="container">
    <h2>Perguntas frequentes</h2>
    <div class="faq__list">
      <div class="faq__item">
        <button class="faq__question" data-testid="faq-question" aria-expanded="false" aria-controls="faq-answer-0">
          Dói o ajuste quiroprático?
        </button>
        <p class="faq__answer" id="faq-answer-0" data-testid="faq-answer-0" hidden>
          Os ajustes são feitos com técnica específica para o seu corpo, respeitando seu
          limite. A maioria dos pacientes relata alívio já nas primeiras sessões.
        </p>
      </div>
      <div class="faq__item">
        <button class="faq__question" data-testid="faq-question" aria-expanded="false" aria-controls="faq-answer-1">
          Quantas sessões eu preciso?
        </button>
        <p class="faq__answer" id="faq-answer-1" data-testid="faq-answer-1" hidden>
          Varia de pessoa para pessoa. Depois da avaliação inicial, Giselle monta um plano
          com a frequência ideal para o seu caso.
        </p>
      </div>
      <div class="faq__item">
        <button class="faq__question" data-testid="faq-question" aria-expanded="false" aria-controls="faq-answer-2">
          A Giselle atende convênio?
        </button>
        <p class="faq__answer" id="faq-answer-2" data-testid="faq-answer-2" hidden>
          O atendimento é particular. Fale pelo WhatsApp para saber mais sobre como funciona.
        </p>
      </div>
    </div>
  </div>
</section>
```

- [ ] **Step 4: Implement the toggle behavior**

Append to `js/main.js`:

```js
document.querySelectorAll('.faq__question').forEach((button) => {
  button.addEventListener('click', () => {
    const expanded = button.getAttribute('aria-expanded') === 'true';
    const answer = document.getElementById(button.getAttribute('aria-controls'));
    button.setAttribute('aria-expanded', String(!expanded));
    answer.hidden = expanded;
  });
});
```

- [ ] **Step 5: Add styles**

Append to `css/styles.css`:

```css
.faq {
  padding: 56px 0;
}

.faq__list {
  margin-top: 24px;
  display: grid;
  gap: 12px;
}

.faq__item {
  border: 1px solid var(--color-gray-100);
  border-radius: 12px;
  padding: 16px 20px;
}

.faq__question {
  width: 100%;
  text-align: left;
  background: none;
  border: none;
  font-family: var(--font-heading);
  font-weight: 700;
  font-size: 1rem;
  cursor: pointer;
  padding: 0;
}

.faq__answer {
  margin: 12px 0 0;
}
```

- [ ] **Step 6: Run test to verify it passes**

Run: `npx playwright test tests/faq.spec.js`
Expected: PASS (1 passed).

- [ ] **Step 7: Commit**

```bash
git add index.html css/styles.css js/main.js tests/faq.spec.js
git commit -m "feat: add FAQ accordion section"
```

---

### Task 8: Localização + CTA final + Footer (LGPD) + floating WhatsApp button

**Files:**
- Modify: `index.html`
- Modify: `css/styles.css`
- Modify: `js/main.js`
- Create: `tests/footer-and-floating-cta.spec.js`

**Interfaces:**
- Consumes: the `[data-whatsapp-cta]` tracking contract from Task 3 (the final CTA and floating button need no new JS — they inherit tracking automatically by using the same `data-whatsapp-cta`/`data-location` attributes), and the shared test helper `tests/utils/whatsapp.js` (`clickAndCapture`) from Task 3 — **do not redefine this logic inline.**
- Produces: `data-testid="localizacao-section"`, `data-testid="site-footer"`, `data-testid="whatsapp-cta-final"`, `data-testid="whatsapp-cta-floating"`.

- [ ] **Step 1: Write the failing tests**

Create `tests/footer-and-floating-cta.spec.js`:

```js
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx playwright test tests/footer-and-floating-cta.spec.js`
Expected: FAIL — none of this markup exists yet.

- [ ] **Step 3: Implement the markup**

Inside `index.html`, immediately after the `.faq` section's closing `</section>`, add:

```html
<section class="localizacao" data-testid="localizacao-section">
  <div class="container">
    <h2>Onde fica o consultório</h2>
    <p>O2 Corporate &amp; Offices — Av. José Silva de Azevedo Neto, 200, BL 06 Sala 414, Barra da Tijuca, Rio de Janeiro - RJ</p>
    <iframe
      title="Mapa do consultório na Barra da Tijuca"
      src="https://maps.google.com/maps?q=Av.+Jos%C3%A9+Silva+de+Azevedo+Neto%2C+200+-+Barra+da+Tijuca%2C+Rio+de+Janeiro+-+RJ&amp;output=embed"
      width="100%"
      height="320"
      style="border:0"
      loading="lazy"
    ></iframe>
  </div>
</section>

<section class="cta-final">
  <div class="container">
    <h2>Pronto(a) para cuidar da sua coluna?</h2>
    <a
      class="btn btn--lime btn--large"
      data-testid="whatsapp-cta-final"
      data-whatsapp-cta
      data-location="final_cta"
      target="_blank"
      rel="noopener"
      href="https://wa.me/5521984743764?text=Ol%C3%A1%20Giselle!%20Vim%20pela%20p%C3%A1gina%20de%20Quiropraxia%20e%20gostaria%20de%20agendar%20uma%20avalia%C3%A7%C3%A3o."
    >Agendar avaliação no WhatsApp</a>
  </div>
</section>

<footer class="site-footer" data-testid="site-footer">
  <div class="container">
    <p>
      <a href="https://www.instagram.com/fisio_giselleguimaraes/" target="_blank" rel="noopener">Instagram</a>
      · <a href="mailto:gisellecguimaraes@yahoo.com.br">gisellecguimaraes@yahoo.com.br</a>
    </p>
    <p class="site-footer__lgpd">
      Este site utiliza cookies de análise (Google Analytics) e de anúncios (Google Ads)
      para entender o comportamento de navegação e mensurar resultados de campanha. Ao
      continuar navegando, você concorda com esse uso.
    </p>
  </div>
</footer>

<a
  class="whatsapp-floating"
  data-testid="whatsapp-cta-floating"
  data-whatsapp-cta
  data-location="floating_button"
  target="_blank"
  rel="noopener"
  hidden
  href="https://wa.me/5521984743764?text=Ol%C3%A1%20Giselle!%20Vim%20pela%20p%C3%A1gina%20de%20Quiropraxia%20e%20gostaria%20de%20agendar%20uma%20avalia%C3%A7%C3%A3o."
  aria-label="Agendar no WhatsApp"
>WhatsApp</a>
```

- [ ] **Step 4: Implement the floating button visibility toggle**

Append to `js/main.js`:

```js
const floatingCta = document.querySelector('[data-testid="whatsapp-cta-floating"]');
const heroSection = document.querySelector('.hero');

if (floatingCta && heroSection) {
  const observer = new IntersectionObserver(
    ([entry]) => {
      floatingCta.hidden = entry.isIntersecting;
    },
    { threshold: 0 }
  );
  observer.observe(heroSection);
}
```

- [ ] **Step 5: Add styles**

Append to `css/styles.css`:

```css
.localizacao {
  padding: 56px 0;
}

.localizacao iframe {
  margin-top: 20px;
  border-radius: 12px;
}

.cta-final {
  padding: 56px 0;
  background: var(--color-navy);
  color: var(--color-white);
  text-align: center;
}

.site-footer {
  padding: 32px 0;
  background: var(--color-navy-dark);
  color: var(--color-white);
  font-size: 0.9rem;
}

.site-footer a {
  color: var(--color-lime);
}

.site-footer__lgpd {
  opacity: 0.75;
  margin-top: 12px;
}

.whatsapp-floating {
  position: fixed;
  right: 16px;
  bottom: 16px;
  z-index: 20;
  background: var(--color-lime);
  color: var(--color-navy-dark);
  padding: 14px 18px;
  border-radius: 999px;
  font-family: var(--font-heading);
  font-weight: 700;
  text-decoration: none;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.25);
}

@media (min-width: 900px) {
  .whatsapp-floating {
    display: none;
  }
}
```

- [ ] **Step 6: Run test to verify it passes**

Run: `npx playwright test tests/footer-and-floating-cta.spec.js`
Expected: PASS (4 passed).

- [ ] **Step 7: Run the full suite to confirm no regressions**

Run: `npx playwright test`
Expected: all tests across all spec files PASS.

- [ ] **Step 8: Commit**

```bash
git add index.html css/styles.css js/main.js tests/footer-and-floating-cta.spec.js
git commit -m "feat: add localização, CTA final, footer, and floating WhatsApp button"
```

---

### Task 9: Google Tag Manager container integration

**Files:**
- Modify: `index.html`
- Create: `tests/gtm.spec.js`

**Interfaces:**
- Consumes: `window.dataLayer` initialized in `js/main.js` (Task 3) and the `whatsapp_click` event it pushes.
- Produces: the standard GTM snippet wired into `<head>` and right after `<body>`, using placeholder container ID `GTM-XXXXXXX`. **Task 11 replaces this placeholder with the real container ID once it is created.**

- [ ] **Step 1: Write the failing test**

Create `tests/gtm.spec.js`:

```js
import { test, expect } from '@playwright/test';

test('GTM snippet is wired into head and body', async ({ page }) => {
  const response = await page.goto('/');
  const html = await response.text();
  expect(html).toContain('googletagmanager.com/gtm.js?id=GTM-');
  expect(html).toContain('googletagmanager.com/ns.html?id=GTM-');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx playwright test tests/gtm.spec.js`
Expected: FAIL — no GTM snippet present yet.

- [ ] **Step 3: Add the GTM snippet**

In `index.html`, immediately after the opening `<head>` tag, add:

```html
<!-- Google Tag Manager -->
<script>
(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-XXXXXXX');
</script>
<!-- End Google Tag Manager -->
```

In `index.html`, immediately after the opening `<body>` tag (before `<main id="main-content">`), add:

```html
<!-- Google Tag Manager (noscript) -->
<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-XXXXXXX"
height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>
<!-- End Google Tag Manager (noscript) -->
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx playwright test tests/gtm.spec.js`
Expected: PASS (1 passed).

- [ ] **Step 5: Run the full suite**

Run: `npx playwright test`
Expected: all tests PASS.

- [ ] **Step 6: Commit**

```bash
git add index.html tests/gtm.spec.js
git commit -m "feat: wire Google Tag Manager snippet (placeholder container ID)"
```

---

### Task 10: Deploy to Vercel and connect the custom subdomain

This task is operational (deploying to real, shared infrastructure), not TDD — verify with the steps below instead of a Playwright spec. Confirm with the user before running Steps 1–2, since they create a live, publicly-reachable deployment.

**Files:** none (no code changes — deployment + DNS configuration only).

- [ ] **Step 1: Create the Vercel project and deploy**

Use the `mcp__claude_ai_Vercel__deploy_to_vercel` tool (or `vercel` CLI if the MCP tool is unavailable) to deploy the repository root as a static project named `giselle-quiropraxia`.
Expected: a `*.vercel.app` preview/production URL is returned.

- [ ] **Step 2: Verify the deployment**

Run: `curl -s -o /dev/null -w "%{http_code}" https://<returned-vercel-url>`
Expected: `200`. Then open the URL and confirm the hero headline, all WhatsApp buttons, and the footer render correctly.

- [ ] **Step 3: Add the custom domain in Vercel**

In the Vercel project settings, add domain `quiropraxia.giselleguimaraes.com.br`. Vercel returns a CNAME target (typically `cname.vercel-dns.com`).

- [ ] **Step 4: Add the CNAME record on Hostinger**

In Hostinger hPanel → Domains → DNS Zone Editor for `giselleguimaraes.com.br`, add:
- Type: `CNAME`
- Name/Host: `quiropraxia`
- Points to: the target Vercel gave in Step 3
- TTL: default

- [ ] **Step 5: Verify DNS propagation and HTTPS**

Run: `curl -s -o /dev/null -w "%{http_code}" https://quiropraxia.giselleguimaraes.com.br`
Expected: `200` (may take up to a few hours for DNS to propagate — if it fails immediately, re-check the CNAME value and retry later). Vercel issues the TLS certificate automatically once DNS resolves.

---

### Task 11: Google account setup (GTM, GA4, Google Ads conversion) via Chrome automation, and final verification

This task is operational and browser-driven (configuring third-party SaaS UIs), not TDD. Requires the user's Google account to be logged in in Chrome and available to `claude-in-chrome` browser automation.

**Files:**
- Modify: `index.html` (replace the `GTM-XXXXXXX` placeholder with the real container ID, in both places from Task 9)

- [ ] **Step 1: Create the GTM container**

Using Chrome automation at tagmanager.google.com, logged into Giselle's Google account: create a new container named `quiropraxia.giselleguimaraes.com.br` (target platform: Web). Note the resulting container ID (format `GTM-XXXXXXX`).

- [ ] **Step 2: Create the GA4 property**

Using Chrome automation at analytics.google.com: create a new GA4 property named "Giselle Guimarães — Quiropraxia (Landing Page)", with a Web data stream for `quiropraxia.giselleguimaraes.com.br`. Note the resulting Measurement ID (format `G-XXXXXXXXXX`).

- [ ] **Step 3: Create the Google Ads conversion action**

Using Chrome automation at ads.google.com (existing account), go to Tools & Settings → Conversions → New conversion action → Website. Name it "Clique no WhatsApp", category "Contact", value "Don't use a value", count "One" (per click). Note the resulting Conversion ID and Conversion Label.

- [ ] **Step 4: Configure tags inside GTM**

Inside the GTM container from Step 1:
1. Add a **GA4 Configuration** tag using the Measurement ID from Step 2, trigger: "All Pages".
2. Add a **Custom Event** trigger named `whatsapp_click`, matching event name `whatsapp_click`.
3. Add a **Google Ads Conversion Tracking** tag using the Conversion ID/Label from Step 3, trigger: the `whatsapp_click` custom event trigger from above.
4. Add a **Scroll Depth** built-in trigger (25/50/75/90%, "All pages" set), and a corresponding **GA4 Event** tag (event name `scroll_depth`, same trigger) for engagement visibility — this is not wired to any Ads conversion.
5. Publish the container with version name "Initial launch — WhatsApp conversion + scroll depth".

- [ ] **Step 5: Wire the real container ID into the site**

In `index.html`, replace both occurrences of `GTM-XXXXXXX` (from Task 9) with the real container ID from Step 1.

Run: `npx playwright test tests/gtm.spec.js`
Expected: still PASS (the test only checks for the `googletagmanager.com/gtm.js?id=GTM-` prefix, which matches any real ID).

Commit:
```bash
git add index.html
git commit -m "chore: wire real GTM container ID"
```

- [ ] **Step 6: Redeploy**

Repeat Task 10, Steps 1–2 to push the update live.

- [ ] **Step 7: Verify tracking end-to-end with GTM Preview**

Open the live `quiropraxia.giselleguimaraes.com.br` URL in GTM's Preview mode (Tag Assistant). Click each of the 4 WhatsApp CTAs (header, hero, floating, final) one at a time and confirm for each click:
1. The `whatsapp_click` custom event fires with the expected `click_location`.
2. The GA4 Configuration tag and the Google Ads Conversion Tracking tag both fire.

Scroll the full page and confirm the Scroll Depth trigger fires at 25/50/75/90% and the corresponding GA4 event tag fires.

- [ ] **Step 8: Run a Lighthouse mobile audit**

Run: `npx lighthouse https://quiropraxia.giselleguimaraes.com.br --preset=perf --form-factor=mobile --screenEmulation.mobile --output=json --output-path=./lighthouse-report.json --chrome-flags="--headless"`

Expected: Performance, SEO, and Accessibility categories all score 90 or above. If any score is below 90, inspect `lighthouse-report.json` for the specific failing audits (commonly image sizing or unused CSS) and address them before considering the campaign launch-ready.

- [ ] **Step 9: Final manual cross-check**

On a real mobile device (not just emulation), open the live URL and confirm: all 4 WhatsApp buttons open a chat with the correct prefilled message; the layout looks correct at mobile, tablet, and desktop widths; the map loads; every link (Instagram, e-mail, map) works.
