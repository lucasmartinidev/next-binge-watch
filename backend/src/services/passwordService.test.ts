import bcrypt from 'bcryptjs';
import { describe, expect, it } from 'vitest';
import { AppError } from '../types/error';
import { PasswordService } from './passwordService';

describe('PasswordService (UT-03)', () => {
  const service = new PasswordService('test-pepper', 4);

  it('hashes and verifies two-stage bcryptjs credentials', async () => {
    const { clientSalt, passwordHash } = await service.hashPlaintextTwoStage('secret-pass');
    const clientHash = await bcrypt.hash('secret-pass', clientSalt);
    expect(service.validateClientSalt(clientSalt)).toBe(clientSalt);
    expect(service.validateClientHash(clientHash, clientSalt)).toBe(clientHash);
    expect(await service.verifyClientHash(clientHash, passwordHash)).toBe(true);
    const wrongClientHash = await bcrypt.hash('wrong-pass', clientSalt);
    expect(await service.verifyClientHash(wrongClientHash, passwordHash)).toBe(false);
  });

  it('derives deterministic valid bcrypt fake salts and equalizes null hash verification', async () => {
    const first = service.deriveFakeClientSalt('unknown@example.com');
    const second = service.deriveFakeClientSalt('unknown@example.com');
    const other = service.deriveFakeClientSalt('other@example.com');
    expect(first).toBe(second);
    expect(first).not.toBe(other);
    expect(service.validateClientSalt(first)).toBe(first);
    const clientHash = await bcrypt.hash('secret-pass', first);
    expect(await service.verifyClientHash(clientHash, null)).toBe(false);
  });

  it('rejects malformed bcrypt salts and mismatched client hashes', async () => {
    expect(() => service.validateClientSalt('not-a-salt')).toThrow(AppError);
    expect(() => service.validateClientHash('not-a-hash')).toThrow(AppError);
    const saltA = await service.generateClientSalt();
    const saltB = await service.generateClientSalt();
    const hashA = await bcrypt.hash('password123', saltA);
    expect(() => service.validateClientHash(hashA, saltB)).toThrow(AppError);
  });
});
