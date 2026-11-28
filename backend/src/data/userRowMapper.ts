import type { AuthUser, UserRole } from '../types/auth';
import type { StoredUser } from '../types/user';
import { toIsoTimestamp } from './watchlistRowMapper';

export function mapUserRow(row: Record<string, unknown>): StoredUser {
  return {
    id: String(row.id),
    username: String(row.username),
    email: String(row.email),
    role: String(row.role) as UserRole,
    isActive: Boolean(row.is_active),
    clientSalt: String(row.client_salt),
    passwordHash: String(row.password_hash),
    createdAt: toIsoTimestamp(row.created_at),
    updatedAt: toIsoTimestamp(row.updated_at),
  };
}

export function toPublicUser(user: StoredUser): AuthUser {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
    isActive: user.isActive,
    createdAt: user.createdAt,
  };
}
