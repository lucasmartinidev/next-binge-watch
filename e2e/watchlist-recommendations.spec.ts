import { expect, test } from '@playwright/test';
import { BACKEND_URL, loginViaUi, signInApiAsAdmin } from './helpers/authHelper';

test('E2E-02 & E2E-03: watchlist persistence, episode/season tracking, and Next Binge Watch recommendations', async ({
  page,
  request,
}) => {
  await signInApiAsAdmin(request);
  await request.delete(`${BACKEND_URL}/api/watchlist/169`).catch(() => {});
  await loginViaUi(page);

  await expect(page.getByRole('heading', { name: /Next Binge Watch/i }).first()).toBeVisible();
  const anotherBtn = page.getByRole('button', { name: /Show another/i });
  await anotherBtn.waitFor({ state: 'visible', timeout: 10_000 }).catch(() => {});
  if (await anotherBtn.isVisible()) {
    await anotherBtn.click();
  }

  await page.goto('/series/169');
  await expect(page.getByRole('heading', { level: 1, name: /Breaking Bad/i })).toBeVisible({ timeout: 15_000 });

  await page.getByLabel(/Watch status/i).selectOption('want_to_watch');
  const firstEpisodeCheckbox = page.getByRole('checkbox', { name: /S01E01/i });
  await firstEpisodeCheckbox.click();
  await expect(firstEpisodeCheckbox).toBeChecked({ timeout: 10_000 });
  await expect(page.getByRole('progressbar')).toBeVisible();

  await page.getByRole('button', { name: /Mark season watched/i }).first().click();
  await expect(page.getByText(/Season 1 \(7\/7\)/i)).toBeVisible({ timeout: 10_000 });

  await page.reload();
  await expect(page.getByText(/Season 1 \(7\/7\)/i)).toBeVisible({ timeout: 15_000 });

  await page.getByRole('link', { name: 'Watchlist' }).click();
  await expect(page).toHaveURL('/watchlist');
  await expect(page.getByRole('heading', { name: 'My Watchlist' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Breaking Bad' }).first()).toBeVisible({ timeout: 10_000 });
  await page.getByRole('tab', { name: 'Watching' }).click();
  await expect(page.getByRole('link', { name: 'Breaking Bad' }).first()).toBeVisible({ timeout: 10_000 });

  await page.getByRole('link', { name: 'Home' }).click();
  await expect(page.getByText(/Continue where you left off/i)).toBeVisible({ timeout: 15_000 });

  await request.delete(`${BACKEND_URL}/api/watchlist/169`).catch(() => {});
});
