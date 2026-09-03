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
