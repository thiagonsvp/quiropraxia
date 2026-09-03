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
