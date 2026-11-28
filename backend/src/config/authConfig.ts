const DEFAULT_SESSION_TTL_DAYS = 7;
const DEFAULT_SALT_PEPPER = 'next-binge-watch-dev-pepper';
const DEFAULT_CORS_ORIGINS = 'http://localhost:5173,http://localhost:5181';
const USERNAME_REGEX = /^[A-Za-z0-9-]{1,39}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;
const MAX_PASSWORD_LENGTH = 60;
const MAX_EMAIL_LENGTH = 254;

export type InitialAdminConfig = {
  role: 'ADMIN' | 'USER';
  username: string;
  email: string;
  password: string;
};

export type AuthConfig = {
  sessionTtlDays: number;
  saltPepper: string;
  corsOrigins: string[];
  isProduction: boolean;
  initialAdmin: InitialAdminConfig;
};

function requireNonEmpty(value: string | undefined, name: string): string {
  const trimmed = value?.trim() ?? '';
  if (!trimmed) {
    throw new Error(`${name} is required`);
  }
  return trimmed;
}

function parseSessionTtlDays(rawValue: string | undefined): number {
  if (!rawValue) return DEFAULT_SESSION_TTL_DAYS;
  const parsed = Number(rawValue);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error('SESSION_TTL_DAYS must be a positive integer');
  }
  return parsed;
}

function parseInitialAdmin(): InitialAdminConfig {
  const role = requireNonEmpty(process.env.FIRST_USER_ADMIN_ROLE, 'FIRST_USER_ADMIN_ROLE');
  if (role !== 'ADMIN' && role !== 'USER') {
    throw new Error('FIRST_USER_ADMIN_ROLE must be ADMIN or USER');
  }
  const username = requireNonEmpty(process.env.FIRST_USER_ADMIN_USERNAME, 'FIRST_USER_ADMIN_USERNAME');
  if (!USERNAME_REGEX.test(username)) {
    throw new Error('FIRST_USER_ADMIN_USERNAME must be 1-39 chars of letters, numbers, or dashes');
  }
  const email = requireNonEmpty(process.env.FIRST_USER_ADMIN_EMAIL, 'FIRST_USER_ADMIN_EMAIL').toLowerCase();
  if (email.length > MAX_EMAIL_LENGTH || !EMAIL_REGEX.test(email)) {
    throw new Error('FIRST_USER_ADMIN_EMAIL must be a valid email up to 254 chars');
  }
  const password = process.env.FIRST_USER_ADMIN_PASSWORD ?? '';
  if (password.length < MIN_PASSWORD_LENGTH || password.length > MAX_PASSWORD_LENGTH) {
    throw new Error('FIRST_USER_ADMIN_PASSWORD must be between 8 and 60 characters');
  }
  return { role, username, email, password };
}

export function loadAuthConfig(): AuthConfig {
  const rawOrigins = process.env.CORS_ORIGINS ?? DEFAULT_CORS_ORIGINS;
  const corsOrigins = rawOrigins.split(',').map((item) => item.trim()).filter(Boolean);
  return {
    sessionTtlDays: parseSessionTtlDays(process.env.SESSION_TTL_DAYS),
    saltPepper: process.env.AUTH_SALT_PEPPER?.trim() || DEFAULT_SALT_PEPPER,
    corsOrigins,
    isProduction: process.env.NODE_ENV === 'production',
    initialAdmin: parseInitialAdmin(),
  };
}
