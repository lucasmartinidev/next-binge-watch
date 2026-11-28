import { afterEach, describe, expect, it, vi } from 'vitest';
import { changeOwnPassword, getAuthMe, listDevUsers, loginAsDevUser, loginWithCredentials, logoutSession } from './authService';
import { createManagedUser, deleteManagedUser, listManagedUsers, updateManagedUser } from './userService';

function jsonRes(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
}

describe('authService and userService', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('hashes passwords with bcryptjs before sending login, password change, and user creation requests', async () => {
    const sampleUser = { id: 'u1', username: 'admin', email: 'a@e.com', role: 'ADMIN', isActive: true, createdAt: '' };
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(jsonRes({ salt: '$2b$04$abcdefghijklmnopqrstuv' }))
      .mockResolvedValueOnce(jsonRes({ user: sampleUser }))
      .mockResolvedValueOnce(jsonRes({ authenticated: true, user: sampleUser }))
      .mockResolvedValueOnce(new Response(null, { status: 204 }))
      .mockResolvedValueOnce(jsonRes({ salt: '$2b$04$abcdefghijklmnopqrstuv' }))
      .mockResolvedValueOnce(new Response(null, { status: 204 }))
      .mockResolvedValueOnce(jsonRes({ users: [sampleUser] }))
      .mockResolvedValueOnce(jsonRes({ user: sampleUser }));

    const loggedIn = await loginWithCredentials({ identifier: 'admin', password: 'secret-password', locale: 'en' });
    expect(loggedIn.username).toBe('admin');
    const loginBody = String(fetchSpy.mock.calls[1]?.[1]?.body ?? '');
    expect(loginBody).not.toContain('secret-password');
    expect(loginBody).toContain('passwordHash');

    expect((await getAuthMe()).authenticated).toBe(true);
    await logoutSession();
    await changeOwnPassword({ currentPassword: 'secret-password', newPassword: 'new-password-123', locale: 'en' });
    const changeBody = String(fetchSpy.mock.calls[5]?.[1]?.body ?? '');
    expect(changeBody).not.toContain('secret-password');
    expect(changeBody).not.toContain('new-password-123');

    expect(await listDevUsers('en')).toHaveLength(1);
    expect((await loginAsDevUser('u1', 'en')).id).toBe('u1');
  });

  it('manages users via /api/users endpoints', async () => {
    const sampleUser = { id: 'u2', username: 'viewer', email: 'v@e.com', role: 'USER', isActive: true, createdAt: '' };
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(jsonRes({ users: [sampleUser] }))
      .mockResolvedValueOnce(jsonRes({ user: sampleUser }, 201))
      .mockResolvedValueOnce(jsonRes({ user: { ...sampleUser, role: 'ADMIN' } }))
      .mockResolvedValueOnce(new Response(null, { status: 204 }));

    expect(await listManagedUsers('en')).toHaveLength(1);
    const created = await createManagedUser({ username: 'viewer', email: 'v@e.com', role: 'USER', password: 'raw-password-123' }, 'en');
    expect(created.username).toBe('viewer');
    expect(String(fetchSpy.mock.calls[1]?.[1]?.body ?? '')).not.toContain('raw-password-123');
    expect((await updateManagedUser('u2', { role: 'ADMIN' }, 'en')).role).toBe('ADMIN');
    await deleteManagedUser('u2', 'en');
  });
});
