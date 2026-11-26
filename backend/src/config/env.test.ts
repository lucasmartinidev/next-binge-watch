import { afterEach, describe, expect, it } from 'vitest';
import { loadEnv } from './env';

describe('loadEnv', () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('returns default values when optional variables are unset', () => {
    delete process.env.PORT;
    delete process.env.DATABASE_URL;
    delete process.env.TVMAZE_BASE_URL;
    delete process.env.TVMAZE_TIMEOUT_MS;
    expect(loadEnv()).toEqual({
      port: 3000,
      databaseUrl: 'file:./data/next-binge-watch.db',
      tvmazeBaseUrl: 'https://api.tvmaze.com',
      tvmazeTimeoutMs: 5000,
    });
  });

  it('parses custom environment variables and trims trailing slashes', () => {
    process.env.PORT = '3050';
    process.env.DATABASE_URL = 'file::memory:';
    process.env.TVMAZE_BASE_URL = 'https://api.tvmaze.com/';
    process.env.TVMAZE_TIMEOUT_MS = '3000';
    expect(loadEnv()).toEqual({
      port: 3050,
      databaseUrl: 'file::memory:',
      tvmazeBaseUrl: 'https://api.tvmaze.com',
      tvmazeTimeoutMs: 3000,
    });
  });

  it('throws when PORT is out of range or non-numeric', () => {
    process.env.PORT = '70000';
    expect(() => loadEnv()).toThrow('PORT must be between 1 and 65535');
    process.env.PORT = 'abc';
    expect(() => loadEnv()).toThrow('PORT must be a positive integer');
  });
});
