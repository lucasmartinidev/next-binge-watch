import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { expect, type APIRequestContext, type Page } from '@playwright/test';

export const BACKEND_URL = 'http://localhost:3051';

export type AdminSeedCredentials = {
  username: string;
  email: string;
  password: string;
};

export function readSeededAdminCredentials(): AdminSeedCredentials {
  const envPath = resolve(process.cwd(), '../backend/.env');
  const raw = readFileSync(envPath, 'utf8');
  const map = new Map<string, string>();
  for (const line of raw.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIndex = trimmed.indexOf('=');
    if (eqIndex > 0) map.set(trimmed.slice(0, eqIndex).trim(), trimmed.slice(eqIndex + 1).trim());
  }
  return {
    username: map.get('FIRST_USER_ADMIN_USERNAME') ?? 'super-admin',
    email: map.get('FIRST_USER_ADMIN_EMAIL') ?? 'super-admin@nextbingwatch.com',
    password: map.get('FIRST_USER_ADMIN_PASSWORD') ?? '',
  };
}

export async function loginViaUi(page: Page, identifier?: string, password?: string): Promise<void> {
  const creds = readSeededAdminCredentials();
  await page.goto('/login');
  await page.getByLabel(/Username or email|Nome de usuário ou e-mail/i).fill(identifier ?? creds.username);
  await page.getByLabel(/^Password$|^Senha$/i).fill(password ?? creds.password);
  await page.locator('form').getByRole('button', { name: /^Sign In$|^Entrar$/i }).click();
  await expect(page).not.toHaveURL(/\/login$/, { timeout: 10_000 });
}

export async function signInApiAsAdmin(request: APIRequestContext): Promise<void> {
  const usersRes = await request.get(`${BACKEND_URL}/api/auth/dev/users`);
  const { users } = (await usersRes.json()) as { users: Array<{ id: string; role: string }> };
  const admin = users.find((u) => u.role === 'ADMIN') ?? users[0];
  await request.post(`${BACKEND_URL}/api/auth/dev/login`, { data: { userId: admin.id } });
}
