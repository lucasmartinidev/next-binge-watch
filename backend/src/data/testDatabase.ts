import 'dotenv/config';
import { createDatabase, type DatabaseClient } from './database';

export function getTestDatabaseUrl(): string {
  const url = process.env.TEST_DATABASE_URL?.trim();
  if (!url) {
    throw new Error('TEST_DATABASE_URL is required to run PostgreSQL integration tests');
  }
  return url;
}

export async function resetTestDatabase(db: DatabaseClient): Promise<void> {
  await db.query('TRUNCATE TABLE watched_episodes, watchlist_items, user_preferences CASCADE');
}

export async function openTestDatabase(): Promise<DatabaseClient> {
  const db = await createDatabase(getTestDatabaseUrl());
  await resetTestDatabase(db);
  return db;
}
