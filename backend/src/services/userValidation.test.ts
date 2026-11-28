import { describe, expect, it } from 'vitest';
import { AppError } from '../types/error';
import { validateEmail, validateIdentifier, validateRole, validateUsername, validateUuid } from './userValidation';

describe('userValidation (UT-01, UT-02)', () => {
  it('validates usernames with 1-39 letters, numbers, and dashes only (UT-01)', () => {
    expect(validateUsername('  Super-Admin01  ')).toBe('Super-Admin01');
    expect(validateUsername('a'.repeat(39))).toBe('a'.repeat(39));
    expect(() => validateUsername('')).toThrow(AppError);
    expect(() => validateUsername('bad_user')).toThrow(AppError);
    expect(() => validateUsername('bad user')).toThrow(AppError);
    expect(() => validateUsername('a'.repeat(40))).toThrow(AppError);
  });

  it('validates emails, roles, UUIDs, and login identifiers (UT-02)', () => {
    expect(validateEmail(' User@Example.COM ')).toBe('user@example.com');
    expect(() => validateEmail('invalid-email')).toThrow(AppError);
    expect(() => validateEmail(`${'a'.repeat(245)}@example.com`)).toThrow(AppError);
    expect(validateRole('ADMIN')).toBe('ADMIN');
    expect(validateRole('USER')).toBe('USER');
    expect(() => validateRole('OWNER')).toThrow(AppError);
    expect(validateUuid('8C5D9A12-4E7B-4F1A-9C2D-1A2B3C4D5E6F')).toBe('8c5d9a12-4e7b-4f1a-9c2d-1a2b3c4d5e6f');
    expect(() => validateUuid('not-a-uuid')).toThrow(AppError);
    expect(validateIdentifier(' Admin@Test.com ')).toBe('admin@test.com');
    expect(() => validateIdentifier('   ')).toThrow(AppError);
  });
});
