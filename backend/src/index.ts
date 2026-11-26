import type { Server } from 'node:http';
import { loadEnv } from './config/env';
import { logger } from './config/logger';
import { closeDatabase, createDatabase, type DatabaseClient } from './data/database';
import { createApp } from './app';

const SHUTDOWN_DEADLINE_MS = 10_000;

function registerShutdownHandlers(server: Server, db: DatabaseClient): void {
  let shuttingDown = false;
  async function shutdown(signal: string): Promise<void> {
    if (shuttingDown) {
      return;
    }
    shuttingDown = true;
    logger.info('Shutdown signal received', { signal });
    const forceExitTimer = setTimeout(() => {
      logger.error('Shutdown deadline exceeded');
      process.exit(1);
    }, SHUTDOWN_DEADLINE_MS);
    server.close(async (closeError) => {
      if (closeError) {
        logger.error('Failed to close HTTP server', closeError);
        process.exitCode = 1;
      }
      await closeDatabase(db);
      clearTimeout(forceExitTimer);
      process.exit();
    });
  }
  process.once('SIGTERM', () => void shutdown('SIGTERM'));
  process.once('SIGINT', () => void shutdown('SIGINT'));
}

async function start(): Promise<void> {
  const env = loadEnv();
  const db = await createDatabase(env.databaseUrl);
  const app = createApp({
    db,
    tvmazeBaseUrl: env.tvmazeBaseUrl,
    tvmazeTimeoutMs: env.tvmazeTimeoutMs,
  });
  const server = app.listen(env.port, () => {
    logger.info('Backend server started', { port: env.port });
  });
  registerShutdownHandlers(server, db);
}

void start().catch((error: unknown) => {
  logger.error('Failed to start backend server', error);
  process.exit(1);
});
