import bcrypt from 'bcryptjs';
import { createHmac } from 'node:crypto';
import { AppError } from '../types/error';

const DEFAULT_ROUNDS = 10;
const BCRYPT_SALT_REGEX = /^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{22}$/;
const BCRYPT_HASH_REGEX = /^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/;
const BCRYPT_ALPHABET = './ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
const SALT_BODY_LENGTH = 22;
const DUMMY_BCRYPT_HASH = '$2b$10$abcdefghijklmnopqrstuvABCDEFGHIJKLMNOPQRSTUVWXYZ01234';

export class PasswordService {
  constructor(
    private readonly saltPepper: string,
    private readonly rounds = DEFAULT_ROUNDS,
  ) {}

  validateClientSalt(raw: unknown): string {
    if (typeof raw !== 'string' || !BCRYPT_SALT_REGEX.test(raw)) {
      throw new AppError('VALIDATION_ERROR', 'auth.invalidPasswordHash');
    }
    return raw;
  }

  validateClientHash(raw: unknown, expectedSalt?: string): string {
    if (typeof raw !== 'string' || !BCRYPT_HASH_REGEX.test(raw)) {
      throw new AppError('VALIDATION_ERROR', 'auth.invalidPasswordHash');
    }
    if (expectedSalt && !raw.startsWith(expectedSalt)) {
      throw new AppError('VALIDATION_ERROR', 'auth.invalidPasswordHash');
    }
    return raw;
  }

  generateClientSalt(): Promise<string> {
    return bcrypt.genSalt(this.rounds);
  }

  deriveFakeClientSalt(normalizedIdentifier: string): string {
    const digest = createHmac('sha256', this.saltPepper).update(normalizedIdentifier).digest();
    let saltBody = '';
    for (let i = 0; i < SALT_BODY_LENGTH; i += 1) {
      saltBody += BCRYPT_ALPHABET[digest[i % digest.length] % BCRYPT_ALPHABET.length];
    }
    return `$2b$10$${saltBody}`;
  }

  hashClientHashForStorage(clientPasswordHash: string): Promise<string> {
    const validated = this.validateClientHash(clientPasswordHash);
    return bcrypt.hash(validated, this.rounds);
  }

  async verifyClientHash(clientPasswordHash: string, storedHash: string | null): Promise<boolean> {
    const validated = this.validateClientHash(clientPasswordHash);
    if (!storedHash) {
      await bcrypt.compare(validated, DUMMY_BCRYPT_HASH);
      return false;
    }
    return bcrypt.compare(validated, storedHash);
  }

  async hashPlaintextTwoStage(plaintext: string): Promise<{ clientSalt: string; passwordHash: string }> {
    const clientSalt = await this.generateClientSalt();
    const clientHash = await bcrypt.hash(plaintext, clientSalt);
    const passwordHash = await bcrypt.hash(clientHash, this.rounds);
    return { clientSalt, passwordHash };
  }
}
