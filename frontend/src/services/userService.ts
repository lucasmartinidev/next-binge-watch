import type { AuthUser, CreateUserFormInput, UpdateUserInput } from '@/types/auth';
import type { Locale } from '@/types/locale';
import { apiRequest } from './apiClient';
import { generateClientSalt, hashClientPassword } from './passwordHasher';

export async function listManagedUsers(locale: Locale): Promise<AuthUser[]> {
  const response = await apiRequest<{ users: AuthUser[] }>('/api/users', { locale });
  return response.users;
}

export async function createManagedUser(input: CreateUserFormInput, locale: Locale): Promise<AuthUser> {
  const clientSalt = await generateClientSalt();
  const passwordHash = await hashClientPassword(input.password, clientSalt);
  const response = await apiRequest<{ user: AuthUser }>('/api/users', {
    method: 'POST',
    locale,
    body: {
      username: input.username.trim(),
      email: input.email.trim().toLowerCase(),
      role: input.role,
      clientSalt,
      passwordHash,
    },
  });
  return response.user;
}

export async function updateManagedUser(
  userId: string,
  patch: UpdateUserInput,
  locale: Locale,
): Promise<AuthUser> {
  const response = await apiRequest<{ user: AuthUser }>(`/api/users/${encodeURIComponent(userId)}`, {
    method: 'PATCH',
    locale,
    body: patch,
  });
  return response.user;
}

export function deleteManagedUser(userId: string, locale: Locale): Promise<void> {
  return apiRequest<void>(`/api/users/${encodeURIComponent(userId)}`, {
    method: 'DELETE',
    locale,
  });
}
