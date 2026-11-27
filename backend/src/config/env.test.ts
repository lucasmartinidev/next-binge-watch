import { afterEach, describe, expect, it } from 'vitest';
import { loadEnv } from './env';

const VALID_PG_URL = 'postgresql://postgres:postgres@localhost:5432/next_binge_watch';

describe('loadEnv (UT-01)', () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('returns default optional values when DATABASE_URL is a valid PostgreSQL URL', () => {
    delete process.env.PORT;
    delete process.env.TVMAZE_BASE_URL;
    delete process.env.TVMAZE_TIMEOUT_MS;
    process.env.DATABASE_URL = VALID_PG_URL;
    expect(loadEnv()).toEqual({
      port: 3000,
      databaseUrl: VALID_PG_URL,
      tvmazeBaseUrl: 'https://api.tvmaze.com',
      tvmazeTimeoutMs: 5000,
    });
  });

  it('parses custom environment variables and accepts postgres:// protocol', () => {
    process.env.PORT = '3050';
    process.env.DATABASE_URL = 'postgres://user:pass@localhost:5432/custom_db';
    process.env.TVMAZE_BASE_URL = 'https://api.tvmaze.com/';
    process.env.TVMAZE_TIMEOUT_MS = '3000';
    expect(loadEnv()).toEqual({
      port: 3050,
      databaseUrl: 'postgres://user:pass@localhost:5432/custom_db',
      tvmazeBaseUrl: 'https://api.tvmaze.com',
      tvmazeTimeoutMs: 3000,
    });
  });

  it('throws when DATABASE_URL is missing, malformed, or non-PostgreSQL', () => {
    delete process.env.DATABASE_URL;
    expect(() => loadEnv()).toThrow('DATABASE_URL is required');
    process.env.DATABASE_URL = 'not-a-url';
    expect(() => loadEnv()).toThrow('DATABASE_URL must be a valid PostgreSQL connection URL');
    process.env.DATABASE_URL = 'file:./data/next-binge-watch.db';
    expect(() => loadEnv()).toThrow('DATABASE_URL must use the postgres:// or postgresql:// protocol');
  });

  it('throws when PORT is out of range or non-numeric', () => {
    process.env.DATABASE_URL = VALID_PG_URL;
    process.env.PORT = '70000';
    expect(() => loadEnv()).toThrow('PORT must be between 1 and 65535');
    process.env.PORT = 'abc';
    expect(() => loadEnv()).toThrow('PORT must be a positive integer');
  });
});
