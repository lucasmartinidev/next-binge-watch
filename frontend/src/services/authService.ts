import type { AuthMeResponse, AuthUser, ChangePasswordInput } from '@/types/auth';
import type { Locale } from '@/types/locale';
import { apiRequest } from './apiClient';
import { generateClientSalt, hashClientPassword } from './passwordHasher';

export function getAuthMe(): Promise<AuthMeResponse> {
  return apiRequest<AuthMeResponse>('/api/auth/me');
}

export async function loginWithCredentials(input: {
  identifier: string;
  password: string;
  locale: Locale;
}): Promise<AuthUser> {
  const challenge = await apiRequest<{ salt: string }>('/api/auth/challenge', {
    method: 'POST',
    locale: input.locale,
    body: { identifier: input.identifier },
  });
  const passwordHash = await hashClientPassword(input.password, challenge.salt);
  const response = await apiRequest<{ user: AuthUser }>('/api/auth/login', {
    method: 'POST',
    locale: input.locale,
    body: { identifier: input.identifier, passwordHash },
  });
  return response.user;
}

export function logoutSession(): Promise<void> {
  return apiRequest<void>('/api/auth/logout', { method: 'POST' });
}

export async function changeOwnPassword(input: ChangePasswordInput & { locale: Locale }): Promise<void> {
  const challenge = await apiRequest<{ salt: string }>('/api/auth/password-challenge', { locale: input.locale });
  const currentPasswordHash = await hashClientPassword(input.currentPassword, challenge.salt);
  const newClientSalt = await generateClientSalt();
  const newPasswordHash = await hashClientPassword(input.newPassword, newClientSalt);
  await apiRequest<void>('/api/auth/change-password', {
    method: 'POST',
    locale: input.locale,
    body: { currentPasswordHash, newClientSalt, newPasswordHash },
  });
}

export async function listDevUsers(locale: Locale): Promise<AuthUser[]> {
  const response = await apiRequest<{ users: AuthUser[] }>('/api/auth/dev/users', { locale });
  return response.users;
}

export async function loginAsDevUser(userId: string, locale: Locale): Promise<AuthUser> {
  const response = await apiRequest<{ user: AuthUser }>('/api/auth/dev/login', {
    method: 'POST',
    locale,
    body: { userId },
  });
  return response.user;
}
