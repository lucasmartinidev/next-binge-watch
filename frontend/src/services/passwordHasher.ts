import bcrypt from 'bcryptjs';

export const MIN_PASSWORD_LENGTH = 8;
export const MAX_PASSWORD_LENGTH = 60;
const CLIENT_BCRYPT_ROUNDS = 10;

export type PasswordValidationError = 'minLength' | 'maxLength';

export function validatePlainPassword(password: string): PasswordValidationError | null {
  if (password.length < MIN_PASSWORD_LENGTH) {
    return 'minLength';
  }
  if (password.length > MAX_PASSWORD_LENGTH) {
    return 'maxLength';
  }
  return null;
}

export function generateClientSalt(rounds = CLIENT_BCRYPT_ROUNDS): Promise<string> {
  return bcrypt.genSalt(rounds);
}

export function hashClientPassword(plaintext: string, salt: string): Promise<string> {
  return bcrypt.hash(plaintext, salt);
}
