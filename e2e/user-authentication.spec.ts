import { expect, test } from '@playwright/test';
import { loginViaUi, readSeededAdminCredentials } from './helpers/authHelper';

test.describe('User Authentication & Multi-User Watchlists', () => {
  test('E2E-01: public discovery works unauthenticated and /watchlist redirects to /login', async ({ page }) => {
    await page.goto('/series/169');
    await expect(page.getByRole('heading', { level: 1, name: /Breaking Bad/i })).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole('link', { name: 'Sign In' })).toBeVisible();

    await page.goto('/watchlist');
    await expect(page).toHaveURL(/\/login$/);
  });

  test('E2E-02: standard login (email CI), zero plaintext password in payload, reload persistence, and logout', async ({
    page,
  }) => {
    const creds = readSeededAdminCredentials();
    const loginBodies: string[] = [];
    page.on('request', (req) => {
      if (req.url().includes('/api/auth/login') && req.method() === 'POST') {
        loginBodies.push(req.postData() ?? '');
      }
    });

    await loginViaUi(page, creds.email.toUpperCase(), creds.password);
    expect(loginBodies).toHaveLength(1);
    expect(loginBodies[0]).not.toContain(creds.password);
    expect(loginBodies[0]).toContain('$2');

    await expect(page.getByText(creds.username)).toBeVisible();
    await page.reload();
    await expect(page.getByText(creds.username)).toBeVisible();

    await page.getByRole('button', { name: 'Sign Out' }).click();
    await expect(page.getByRole('link', { name: 'Sign In' })).toBeVisible();
  });

  test('E2E-03: self-service password change and re-login with new password', async ({ page }) => {
    const creds = readSeededAdminCredentials();
    await loginViaUi(page, creds.username, creds.password);
    await page.getByRole('link', { name: 'Change Password' }).click();
    await expect(page).toHaveURL('/account/password');

    await page.getByLabel('Current password', { exact: true }).fill(creds.password);
    await page.getByLabel('New password', { exact: true }).fill('UpdatedPass99');
    await page.getByLabel('Confirm new password', { exact: true }).fill('UpdatedPass99');
    await page.getByRole('button', { name: 'Update password' }).click();
    await expect(page.getByText('Password updated successfully.')).toBeVisible();

    await page.getByRole('button', { name: 'Sign Out' }).click();
    await loginViaUi(page, creds.username, 'UpdatedPass99');
    await expect(page.getByText(creds.username)).toBeVisible();

    await page.getByRole('link', { name: 'Change Password' }).click();
    await page.getByLabel('Current password', { exact: true }).fill('UpdatedPass99');
    await page.getByLabel('New password', { exact: true }).fill(creds.password);
    await page.getByLabel('Confirm new password', { exact: true }).fill(creds.password);
    await page.getByRole('button', { name: 'Update password' }).click();
    await expect(page.getByText('Password updated successfully.')).toBeVisible();
  });

  test('E2E-04 & E2E-05: Admin CRUD, multi-user isolation, DEV Mode one-click login, i18n, and mobile', async ({
    page,
  }) => {
    const creds = readSeededAdminCredentials();
    await loginViaUi(page, creds.username, creds.password);

    await page.goto('/watchlist');
    await page.getByRole('button', { name: 'New list' }).click();
    const listDialog = page.getByRole('dialog');
    await listDialog.getByLabel('Name').fill('Admin Only List');
    await listDialog.getByRole('button', { name: 'Save' }).click();
    await expect(page.getByRole('link', { name: 'Admin Only List' })).toBeVisible();

    await page.getByRole('link', { name: 'Users' }).click();
    await expect(page).toHaveURL('/admin/users');
    await page.getByRole('button', { name: 'New User' }).click();
    const userDialog = page.getByRole('dialog');
    await userDialog.getByLabel('Username').fill('e2e-viewer');
    await userDialog.getByLabel('Email').fill('e2e-viewer@example.com');
    await userDialog.getByLabel('Password', { exact: true }).fill('ViewerPass123');
    await userDialog.getByRole('button', { name: 'Create User' }).click();
    await expect(page.getByText('e2e-viewer', { exact: true })).toBeVisible();

    await page.getByRole('button', { name: 'Sign Out' }).click();
    await page.goto('/login');
    await expect(page.getByText('DEV MODE')).toBeVisible();
    await page.locator('li', { hasText: 'e2e-viewer' }).getByRole('button', { name: 'Login' }).click();
    await expect(page.getByText('e2e-viewer', { exact: true })).toBeVisible();

    await page.goto('/watchlist');
    await expect(page.getByRole('link', { name: 'Admin Only List' })).toHaveCount(0);

    await page.setViewportSize({ width: 375, height: 812 });
    await page.getByRole('button', { name: 'PT-BR' }).click();
    await page.goto('/account/password');
    await expect(page.getByRole('heading', { name: 'Alterar Senha' })).toBeVisible();
    const mobileOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    expect(mobileOverflow).toBe(false);

    await page.getByRole('button', { name: 'Sair' }).click();
    await page.setViewportSize({ width: 1280, height: 800 });
    await loginViaUi(page, creds.username, creds.password);
    await page.getByRole('link', { name: /Users|Usuários/i }).click();
    await page.getByRole('button', { name: /Delete e2e-viewer|Excluir e2e-viewer/i }).click();
    await page.getByRole('alertdialog').getByRole('button', { name: /Delete user|Excluir usuário/i }).click();
    await expect(page.getByText('e2e-viewer', { exact: true })).toHaveCount(0);
  });
});
