import { Pool, type PoolConfig } from 'pg';
import { logger } from '../config/logger';

const MAX_POOL_CONNECTIONS = 10;
const IDLE_TIMEOUT_MS = 30_000;
const CONNECTION_TIMEOUT_MS = 5_000;
const STATEMENT_TIMEOUT_MS = 5_000;

export type DatabaseClient = Pool;

export type DatabaseOptions = {
  createPool?: (config: PoolConfig) => Pool;
};

function buildPoolConfig(databaseUrl: string): PoolConfig {
  return {
    connectionString: databaseUrl,
    max: MAX_POOL_CONNECTIONS,
    idleTimeoutMillis: IDLE_TIMEOUT_MS,
    connectionTimeoutMillis: CONNECTION_TIMEOUT_MS,
    statement_timeout: STATEMENT_TIMEOUT_MS,
  };
}

export async function createDatabase(
  databaseUrl: string,
  options?: DatabaseOptions,
): Promise<DatabaseClient> {
  const poolFactory = options?.createPool ?? ((config: PoolConfig) => new Pool(config));
  const pool = poolFactory(buildPoolConfig(databaseUrl));
  pool.on('error', (error: Error) => {
    logger.error('Unexpected PostgreSQL pool error', error);
  });
  try {
    await pool.query('SELECT 1');
    return pool;
  } catch (error: unknown) {
    await pool.end().catch(() => undefined);
    throw error;
  }
}

export async function pingDatabase(client: DatabaseClient): Promise<boolean> {
  try {
    await client.query('SELECT 1');
    return true;
  } catch {
    return false;
  }
}

export async function closeDatabase(client: DatabaseClient): Promise<void> {
  await client.end();
}
