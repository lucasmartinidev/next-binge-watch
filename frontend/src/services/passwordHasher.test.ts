import bcrypt from 'bcryptjs';
import { describe, expect, it } from 'vitest';
import { generateClientSalt, hashClientPassword, validatePlainPassword } from './passwordHasher';

describe('passwordHasher (UT-10)', () => {
  it('validates 8-60 character password length bounds', () => {
    expect(validatePlainPassword('short')).toBe('minLength');
    expect(validatePlainPassword('12345678')).toBeNull();
    expect(validatePlainPassword('a'.repeat(60))).toBeNull();
    expect(validatePlainPassword('a'.repeat(61))).toBe('maxLength');
  });

  it('generates valid bcrypt salts and hashes passwords asynchronously', async () => {
    const salt = await generateClientSalt(4);
    const hash = await hashClientPassword('my-secret-pass', salt);
    expect(hash.startsWith(salt)).toBe(true);
    expect(await bcrypt.compare('my-secret-pass', hash)).toBe(true);
  });
});
