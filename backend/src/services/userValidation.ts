import type { UserRole } from '../types/auth';
import { AppError } from '../types/error';

const USERNAME_REGEX = /^[A-Za-z0-9-]{1,39}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_EMAIL_LENGTH = 254;

export function validateUsername(raw: unknown): string {
  const trimmed = typeof raw === 'string' ? raw.trim() : '';
  if (!USERNAME_REGEX.test(trimmed)) {
    throw new AppError('VALIDATION_ERROR', 'users.invalidUsername');
  }
  return trimmed;
}

export function validateEmail(raw: unknown): string {
  const trimmed = typeof raw === 'string' ? raw.trim().toLowerCase() : '';
  if (!trimmed || trimmed.length > MAX_EMAIL_LENGTH || !EMAIL_REGEX.test(trimmed)) {
    throw new AppError('VALIDATION_ERROR', 'users.invalidEmail');
  }
  return trimmed;
}

export function validateRole(raw: unknown): UserRole {
  if (raw === 'ADMIN' || raw === 'USER') {
    return raw;
  }
  throw new AppError('VALIDATION_ERROR', 'users.invalidRole');
}

export function validateUuid(raw: unknown): string {
  const trimmed = typeof raw === 'string' ? raw.trim() : '';
  if (!UUID_REGEX.test(trimmed)) {
    throw new AppError('VALIDATION_ERROR', 'common.invalidId');
  }
  return trimmed.toLowerCase();
}

export function validateIdentifier(raw: unknown): string {
  const trimmed = typeof raw === 'string' ? raw.trim() : '';
  if (!trimmed || trimmed.length > MAX_EMAIL_LENGTH) {
    throw new AppError('VALIDATION_ERROR', 'auth.identifierRequired');
  }
  return trimmed.toLowerCase();
}
