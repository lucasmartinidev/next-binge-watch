import { expect, test } from '@playwright/test';

const BACKEND_URL = 'http://localhost:3051';

test('E2E-04: browser locale auto-detection, fallback, manual switch, and persistence', async ({
  browser,
  request,
}) => {
  const ptContext = await browser.newContext({ locale: 'pt-BR' });
  const ptPage = await ptContext.newPage();
  await ptPage.goto('/');
  await expect(ptPage.getByRole('link', { name: 'Minha Lista' })).toBeVisible();
  await ptContext.close();

  const frContext = await browser.newContext({ locale: 'fr-FR' });
  const frPage = await frContext.newPage();
  await frPage.goto('/');
  await expect(frPage.getByRole('link', { name: 'Watchlist' })).toBeVisible();

  await frPage.getByRole('button', { name: 'PT-BR' }).click();
  await expect(frPage.getByRole('link', { name: 'Minha Lista' })).toBeVisible();
  await frPage.reload();
  await expect(frPage.getByRole('link', { name: 'Minha Lista' })).toBeVisible();

  await frPage.goto('/series/999999999');
  await expect(frPage.getByRole('alert')).toContainText('Série não encontrada.');

  await request.put(`${BACKEND_URL}/api/preferences`, { data: { locale: 'en' } });
  await frContext.close();
});

test('E2E-05: empty search, error recovery with retry, responsive layout, and keyboard navigation', async ({
  page,
}) => {
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

  const mobileOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth,
  );
  expect(mobileOverflow).toBe(false);

  await page.setViewportSize({ width: 1280, height: 800 });
  const desktopOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth,
  );
  expect(desktopOverflow).toBe(false);

  await page.keyboard.press('Tab');
  await expect(page.locator(':focus')).toBeVisible();
});
