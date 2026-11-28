import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { loadEnv } from './env';

const VALID_PG_URL = 'postgresql://postgres:postgres@localhost:5432/next_binge_watch';

function setValidAdminEnv(): void {
  process.env.FIRST_USER_ADMIN_ROLE = 'ADMIN';
  process.env.FIRST_USER_ADMIN_USERNAME = 'super-admin';
  process.env.FIRST_USER_ADMIN_EMAIL = 'super-admin@example.com';
  process.env.FIRST_USER_ADMIN_PASSWORD = 'password123';
}

describe('loadEnv (UT-01)', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    setValidAdminEnv();
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('returns default optional values when DATABASE_URL and admin vars are valid', () => {
    delete process.env.PORT;
    delete process.env.TVMAZE_BASE_URL;
    delete process.env.TVMAZE_TIMEOUT_MS;
    delete process.env.SESSION_TTL_DAYS;
    delete process.env.AUTH_SALT_PEPPER;
    delete process.env.CORS_ORIGINS;
    process.env.DATABASE_URL = VALID_PG_URL;
    const loaded = loadEnv();
    expect(loaded.port).toBe(3000);
    expect(loaded.databaseUrl).toBe(VALID_PG_URL);
    expect(loaded.tvmazeBaseUrl).toBe('https://api.tvmaze.com');
    expect(loaded.tvmazeTimeoutMs).toBe(5000);
    expect(loaded.auth.sessionTtlDays).toBe(7);
    expect(loaded.auth.initialAdmin.username).toBe('super-admin');
  });

  it('parses custom environment variables and accepts postgres:// protocol', () => {
    process.env.PORT = '3050';
    process.env.DATABASE_URL = 'postgres://user:pass@localhost:5432/custom_db';
    process.env.TVMAZE_BASE_URL = 'https://api.tvmaze.com/';
    process.env.TVMAZE_TIMEOUT_MS = '3000';
    process.env.SESSION_TTL_DAYS = '14';
    const loaded = loadEnv();
    expect(loaded.port).toBe(3050);
    expect(loaded.databaseUrl).toBe('postgres://user:pass@localhost:5432/custom_db');
    expect(loaded.tvmazeBaseUrl).toBe('https://api.tvmaze.com');
    expect(loaded.tvmazeTimeoutMs).toBe(3000);
    expect(loaded.auth.sessionTtlDays).toBe(14);
  });

  it('throws when DATABASE_URL is missing, malformed, or non-PostgreSQL', () => {
    delete process.env.DATABASE_URL;
    expect(() => loadEnv()).toThrow('DATABASE_URL is required');
    process.env.DATABASE_URL = 'not-a-url';
    expect(() => loadEnv()).toThrow('DATABASE_URL must be a valid PostgreSQL connection URL');
    process.env.DATABASE_URL = 'file:./data/next-binge-watch.db';
    expect(() => loadEnv()).toThrow('DATABASE_URL must use the postgres:// or postgresql:// protocol');
  });

  it('expands POSTGRES_* variable references in DATABASE_URL and rejects unresolved placeholders', () => {
    process.env.POSTGRES_HOST = 'localhost';
    process.env.POSTGRES_PORT = '5432';
    process.env.POSTGRES_USER = 'postgres';
    process.env.POSTGRES_PASSWORD = 'secret';
    process.env.POSTGRES_DB = 'next_binge_watch';
    process.env.DATABASE_URL = 'postgresql://$POSTGRES_USER:$POSTGRES_PASSWORD@$POSTGRES_HOST:$POSTGRES_PORT/$POSTGRES_DB';
    expect(loadEnv().databaseUrl).toBe('postgresql://postgres:secret@localhost:5432/next_binge_watch');
    delete process.env.POSTGRES_DB;
    expect(() => loadEnv()).toThrow('DATABASE_URL contains unresolved environment variable references');
  });

  it('throws when PORT or initial admin env vars are invalid', () => {
    process.env.DATABASE_URL = VALID_PG_URL;
    process.env.PORT = '70000';
    expect(() => loadEnv()).toThrow('PORT must be between 1 and 65535');
    process.env.PORT = 'abc';
    expect(() => loadEnv()).toThrow('PORT must be a positive integer');
    process.env.PORT = '3000';
    process.env.FIRST_USER_ADMIN_PASSWORD = 'short';
    expect(() => loadEnv()).toThrow('FIRST_USER_ADMIN_PASSWORD must be between 8 and 60 characters');
  });
});
