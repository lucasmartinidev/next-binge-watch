import { expect, test } from '@playwright/test';

test('E2E-01: search partial title, filter scope, navigate Series <-> Person, and verify TVmaze attribution', async ({
  page,
}) => {
  const directTvmazeCalls: string[] = [];
  page.on('request', (req) => {
    if (req.url().includes('api.tvmaze.com')) {
      directTvmazeCalls.push(req.url());
    }
  });

  await page.goto('/');
  await expect(page.getByText('API Online')).toBeVisible({ timeout: 10_000 });
  await expect(page.getByRole('link', { name: 'TVmaze' })).toHaveAttribute('href', 'https://www.tvmaze.com');

  await page.getByRole('searchbox').fill('breaking');
  await page.getByRole('button', { name: /^Search$/i }).click();
  await expect(page.getByRole('link', { name: /Breaking Bad/i }).first()).toBeVisible({ timeout: 15_000 });

  await page.getByRole('button', { name: 'Series', exact: true }).click();
  await page.getByRole('link', { name: /Breaking Bad/i }).first().click();

  await expect(page).toHaveURL(/\/series\/\d+/);
  await expect(page.getByRole('heading', { level: 1, name: /Breaking Bad/i })).toBeVisible({ timeout: 15_000 });
  await expect(page.getByRole('link', { name: /View on TVmaze/i })).toBeVisible();

  await page.getByRole('link', { name: /Bryan Cranston/i }).first().click();
  await expect(page).toHaveURL(/\/people\/\d+/);
  await expect(page.getByRole('heading', { level: 1, name: /Bryan Cranston/i })).toBeVisible({ timeout: 15_000 });

  await page.getByRole('link', { name: /Breaking Bad/i }).first().click();
  await expect(page).toHaveURL(/\/series\/\d+/);
  expect(directTvmazeCalls).toEqual([]);
});
