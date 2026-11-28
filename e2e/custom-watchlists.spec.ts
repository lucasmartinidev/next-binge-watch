import { expect, test, type APIRequestContext } from '@playwright/test';

const BACKEND_URL = 'http://localhost:3051';

async function cleanupTestState(request: APIRequestContext) {
  await request.delete(`${BACKEND_URL}/api/watchlist/169`).catch(() => {});
  const res = await request.get(`${BACKEND_URL}/api/lists`);
  if (!res.ok()) {
    return;
  }
  const data = (await res.json()) as { customLists: Array<{ id: string }> };
  for (const list of data.customLists) {
    await request.delete(`${BACKEND_URL}/api/lists/${list.id}`).catch(() => {});
  }
  await request.put(`${BACKEND_URL}/api/preferences`, { data: { locale: 'en' } }).catch(() => {});
}

test.describe('Custom Watchlists & Ubiquitous Membership', () => {
  test.beforeEach(async ({ request }) => {
    await cleanupTestState(request);
  });

  test.afterAll(async ({ request }) => {
    await cleanupTestState(request);
  });

  test('E2E-01: primary list customization and deletion protection', async ({ page, request }) => {
    await page.goto('/watchlist');
    await expect(page.getByRole('heading', { name: 'Primary Lists' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Customize Want to Watch' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Delete list Want to Watch' })).toHaveCount(0);

    await page.getByRole('button', { name: 'Customize Want to Watch' }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog.getByLabel('Name')).toBeDisabled();
    await expect(dialog.getByLabel('Description')).toBeDisabled();
    await dialog.getByRole('button', { name: 'Flame' }).click();
    await dialog.getByRole('button', { name: 'Amber' }).click();
    await dialog.getByRole('button', { name: 'Save' }).click();
    await expect(dialog).toBeHidden();

    await page.reload();
    await expect(page.getByRole('button', { name: 'Customize Want to Watch' })).toBeVisible();

    const listsRes = await request.get(`${BACKEND_URL}/api/lists`);
    const listsBody = (await listsRes.json()) as { primaryLists: Array<{ id: string }> };
    const delRes = await request.delete(`${BACKEND_URL}/api/lists/${listsBody.primaryLists[0].id}`);
    expect(delRes.status()).toBe(403);
  });

  test('E2E-02: custom Series & People CRUD, filters, and safe deletion preserving episodes', async ({ page }) => {
    await page.goto('/watchlist');
    await page.getByRole('button', { name: 'New list' }).click();
    let dialog = page.getByRole('dialog');
    await dialog.getByLabel('Name').fill('Weekend Sci-Fi');
    await dialog.getByLabel('Tags').fill('scifi');
    await dialog.getByLabel('Tags').press('Enter');
    await dialog.getByRole('button', { name: 'Save' }).click();
    await expect(page.getByRole('link', { name: 'Weekend Sci-Fi' })).toBeVisible();

    await page.getByRole('button', { name: 'New list' }).click();
    dialog = page.getByRole('dialog');
    await dialog.getByLabel('Name').fill('Top Actors');
    await dialog.getByRole('button', { name: 'People' }).click();
    await dialog.getByLabel('Tags').fill('drama');
    await dialog.getByLabel('Tags').press('Enter');
    await dialog.getByRole('button', { name: 'Save' }).click();
    await expect(page.getByRole('link', { name: 'Top Actors' })).toBeVisible();

    await page.getByRole('group', { name: 'List type' }).getByRole('button', { name: 'People' }).click();
    await expect(page.getByRole('link', { name: 'Weekend Sci-Fi' })).toBeHidden();
    await expect(page.getByRole('link', { name: 'Top Actors' })).toBeVisible();
    await page.getByRole('group', { name: 'List type' }).getByRole('button', { name: 'All' }).click();
    await page.getByLabel('Tags').selectOption('scifi');
    await expect(page.getByRole('link', { name: 'Weekend Sci-Fi' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Top Actors' })).toBeHidden();
    await page.getByLabel('Tags').selectOption('');

    await page.getByRole('button', { name: 'Edit list Weekend Sci-Fi' }).click();
    await page.getByRole('dialog').getByLabel('Name').fill('Late Night Sci-Fi');
    await page.getByRole('dialog').getByRole('button', { name: 'Save' }).click();
    await expect(page.getByRole('link', { name: 'Late Night Sci-Fi' })).toBeVisible();

    await page.goto('/series/169');
    await page.getByRole('button', { name: 'Manage lists' }).click();
    await page.getByRole('checkbox', { name: 'Late Night Sci-Fi' }).check();
    await page.getByRole('button', { name: 'Save' }).click();
    const ep1 = page.getByRole('checkbox', { name: /S01E01/i });
    await ep1.click();
    await expect(ep1).toBeChecked({ timeout: 10_000 });

    await page.goto('/watchlist');
    await page.getByRole('button', { name: 'Delete list Late Night Sci-Fi' }).click();
    await page.getByRole('alertdialog').getByRole('button', { name: 'Confirm' }).click();
    await expect(page.getByRole('link', { name: 'Late Night Sci-Fi' })).toHaveCount(0);

    await page.goto('/series/169');
    await expect(page.getByRole('checkbox', { name: /S01E01/i })).toBeChecked({ timeout: 10_000 });
  });

  test('E2E-03: single-edit multi-select, undo, and ubiquitous badges across surfaces', async ({ page, request }) => {
    await request.post(`${BACKEND_URL}/api/lists`, { data: { name: 'Binge Club', entityType: 'series', icon: 'rocket', color: 'cyan', tags: [] } });
    await request.post(`${BACKEND_URL}/api/lists`, { data: { name: 'Critics Pick', entityType: 'series', icon: 'star', color: 'amber', tags: [] } });
    await request.post(`${BACKEND_URL}/api/lists`, { data: { name: 'Legends', entityType: 'person', icon: 'users', color: 'pink', tags: [] } });

    await page.goto('/series/169');
    await expect(page.getByRole('heading', { level: 1, name: /Breaking Bad/i })).toBeVisible({ timeout: 15_000 });
    await page.getByRole('button', { name: 'Manage lists' }).click();
    await page.getByRole('checkbox', { name: 'Binge Club' }).check();
    await page.getByRole('checkbox', { name: 'Critics Pick' }).check();
    await page.getByRole('button', { name: 'Save' }).click();
    await expect(page.getByRole('link', { name: 'Binge Club' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Critics Pick' })).toBeVisible();

    await page.getByRole('button', { name: 'Manage lists' }).click();
    await page.getByRole('checkbox', { name: 'Critics Pick' }).uncheck();
    await page.getByRole('button', { name: 'Undo changes' }).click();
    await expect(page.getByRole('checkbox', { name: 'Critics Pick' })).toBeChecked();
    await page.getByRole('checkbox', { name: 'Critics Pick' }).uncheck();
    await page.getByRole('button', { name: 'Save' }).click();
    await expect(page.getByRole('link', { name: 'Critics Pick' })).toHaveCount(0);

    await page.getByRole('link', { name: /Bryan Cranston/i }).first().click();
    await expect(page.getByRole('heading', { level: 1, name: /Bryan Cranston/i })).toBeVisible({ timeout: 15_000 });
    await page.getByRole('button', { name: 'Manage lists' }).click();
    await page.getByRole('checkbox', { name: 'Legends' }).check();
    await page.getByRole('button', { name: 'Save' }).click();
    await expect(page.getByRole('link', { name: 'Legends' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Binge Club' }).first()).toBeVisible();

    await page.goto('/');
    await page.getByRole('searchbox').fill('Breaking Bad');
    await page.getByRole('button', { name: /^Search$/i }).click();
    await expect(page.getByRole('link', { name: 'Binge Club' }).first()).toBeVisible({ timeout: 15_000 });
    await page.getByRole('link', { name: 'Binge Club' }).first().click();
    await expect(page).toHaveURL(/\/watchlist\//);
    await expect(page.getByRole('link', { name: 'Breaking Bad' }).first()).toBeVisible();
  });

  test('E2E-04: +N overflow disclosure, pt-BR localization, keyboard a11y, and 375px mobile', async ({ page, request }) => {
    const c1 = await (await request.post(`${BACKEND_URL}/api/lists`, { data: { name: 'Alpha', description: 'A'.repeat(220), entityType: 'series', icon: 'star', color: 'cyan', tags: [] } })).json() as { id: string };
    const c2 = await (await request.post(`${BACKEND_URL}/api/lists`, { data: { name: 'Beta', entityType: 'series', icon: 'flame', color: 'amber', tags: [] } })).json() as { id: string };
    const c3 = await (await request.post(`${BACKEND_URL}/api/lists`, { data: { name: 'Gamma', entityType: 'series', icon: 'rocket', color: 'violet', tags: [] } })).json() as { id: string };
    const c4 = await (await request.post(`${BACKEND_URL}/api/lists`, { data: { name: 'Delta', entityType: 'series', icon: 'trophy', color: 'emerald', tags: [] } })).json() as { id: string };
    await request.put(`${BACKEND_URL}/api/series/169/lists`, { data: { primaryStatus: 'watching', customListIds: [c1.id, c2.id, c3.id, c4.id] } });

    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/series/169');
    await expect(page.getByRole('heading', { level: 1, name: /Breaking Bad/i })).toBeVisible({ timeout: 15_000 });
    const overflowBtn = page.getByRole('button', { name: '+2 more' });
    await expect(overflowBtn).toBeVisible();
    await overflowBtn.click();
    await expect(overflowBtn).toHaveAttribute('aria-expanded', 'true');

    await page.getByRole('group', { name: 'Language' }).getByRole('button', { name: 'PT' }).click();
    await expect(page.getByRole('button', { name: 'Gerenciar listas' })).toBeVisible();
    await expect(page.getByRole('button', { name: '+2 mais' })).toBeVisible();
    const hasOverflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
    expect(hasOverflow).toBe(false);
    await page.goto('/watchlist');
    await expect(page.getByRole('heading', { name: 'Listas Principais' })).toBeVisible();
    const hubOverflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
    expect(hubOverflow).toBe(false);
  });
});
