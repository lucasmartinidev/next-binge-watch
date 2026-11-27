import type { Pool, PoolConfig } from 'pg';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { logger } from '../config/logger';
import { closeDatabase, createDatabase, pingDatabase } from './database';

type FakePool = {
  query: ReturnType<typeof vi.fn>;
  end: ReturnType<typeof vi.fn>;
  on: ReturnType<typeof vi.fn>;
};

function makeFakePool(): FakePool {
  return {
    query: vi.fn().mockResolvedValue({ rows: [{ '?column?': 1 }] }),
    end: vi.fn().mockResolvedValue(undefined),
    on: vi.fn(),
  };
}

describe('PostgreSQL database adapter (UT-03)', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('creates a pool, probes connectivity on boot, and logs idle pool errors', async () => {
    const fakePool = makeFakePool();
    const errorSpy = vi.spyOn(logger, 'error').mockImplementation(() => undefined);
    let capturedConfig: PoolConfig | undefined;
    const db = await createDatabase('postgresql://postgres:postgres@localhost:5432/next_binge_watch', {
      createPool: (config) => {
        capturedConfig = config;
        return fakePool as unknown as Pool;
      },
    });
    expect(capturedConfig?.connectionString).toBe('postgresql://postgres:postgres@localhost:5432/next_binge_watch');
    expect(capturedConfig?.max).toBe(10);
    expect(fakePool.query).toHaveBeenCalledWith('SELECT 1');
    const errorListener = fakePool.on.mock.calls.find(([event]) => event === 'error')?.[1] as
      | ((error: Error) => void)
      | undefined;
    expect(errorListener).toBeDefined();
    const idleError = new Error('idle disconnect');
    errorListener?.(idleError);
    expect(errorSpy).toHaveBeenCalledWith('Unexpected PostgreSQL pool error', idleError);
    expect(await pingDatabase(db)).toBe(true);
    await closeDatabase(db);
    expect(fakePool.end).toHaveBeenCalledTimes(1);
  });

  it('closes the pool cleanly and rethrows if the boot connectivity probe fails', async () => {
    const fakePool = makeFakePool();
    fakePool.query.mockRejectedValueOnce(new Error('connection refused'));
    await expect(
      createDatabase('postgresql://postgres:postgres@localhost:5432/next_binge_watch', {
        createPool: () => fakePool as unknown as Pool,
      }),
    ).rejects.toThrow('connection refused');
    expect(fakePool.end).toHaveBeenCalledTimes(1);
  });

  it('returns false from pingDatabase when SELECT 1 rejects', async () => {
    const fakePool = makeFakePool();
    fakePool.query.mockRejectedValueOnce(new Error('pool ended'));
    expect(await pingDatabase(fakePool as unknown as Pool)).toBe(false);
  });
});
