import { expect, test } from '@playwright/test';

test('E2E-04: browser locale auto-detection, fallback, manual switch, and persistence', async ({ browser }) => {
  const ptContext = await browser.newContext({ locale: 'pt-BR' });
  const ptPage = await ptContext.newPage();
  await ptPage.goto('/');
  await expect(ptPage.getByRole('link', { name: 'Entrar' })).toBeVisible();
  await ptContext.close();

  const frContext = await browser.newContext({ locale: 'fr-FR' });
  const frPage = await frContext.newPage();
  await frPage.goto('/');
  await expect(frPage.getByRole('link', { name: 'Sign In' })).toBeVisible();

  await frPage.getByRole('button', { name: 'PT-BR' }).click();
  await expect(frPage.getByRole('link', { name: 'Entrar' })).toBeVisible();
  await frPage.reload();
  await expect(frPage.getByRole('link', { name: 'Entrar' })).toBeVisible();

  await frPage.goto('/series/999999999');
  await expect(frPage.getByRole('alert')).toContainText('Série não encontrada.');
  await frContext.close();
});

test('E2E-05: empty search, error recovery with retry, responsive layout, and keyboard navigation', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('/');

  await page.getByRole('searchbox').fill('zzzznonexistent12345');
  await page.getByRole('button', { name: /^Search$/i }).click();
  await expect(page.getByText('No results found')).toBeVisible({ timeout: 15_000 });

  let failOnce = true;
  await page.route('**/api/search*', async (route) => {
    if (failOnce) {
      failOnce = false;
      await route.fulfill({
        status: 502,
        contentType: 'application/json',
        body: JSON.stringify({ error: { code: 'UPSTREAM_UNAVAILABLE', message: 'Simulated upstream failure' } }),
      });
      return;
    }
    await route.continue();
  });

  await page.getByRole('searchbox').fill('breaking');
  await page.getByRole('button', { name: /^Search$/i }).click();
  await expect(page.getByRole('alert')).toContainText('Simulated upstream failure');
  await page.getByRole('button', { name: /Try again/i }).click();
  await expect(page.getByRole('link', { name: /Breaking Bad/i }).first()).toBeVisible({ timeout: 15_000 });

  const mobileOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  expect(mobileOverflow).toBe(false);

  await page.setViewportSize({ width: 1280, height: 800 });
  const desktopOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  expect(desktopOverflow).toBe(false);

  await page.keyboard.press('Tab');
  await expect(page.locator(':focus')).toBeVisible();
});
