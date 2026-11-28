import { expandEnvValue, loadDotenv } from '../config/envLoader';
import { createDatabase, type DatabaseClient } from './database';
import { seedInitialAdmin } from './initialAdminSeed';

loadDotenv();

const TEST_BCRYPT_ROUNDS = 4;

export function getTestDatabaseUrl(): string {
  const url = expandEnvValue(process.env.TEST_DATABASE_URL?.trim() ?? '', process.env);
  if (!url) {
    throw new Error('TEST_DATABASE_URL is required to run PostgreSQL integration tests');
  }
  return url;
}

export async function resetTestDatabase(db: DatabaseClient): Promise<string> {
  await db.query(
    'TRUNCATE TABLE user_sessions, custom_list_series, custom_list_people, watched_episodes, watchlist_items, user_lists, user_preferences, users CASCADE',
  );
  return seedInitialAdmin(db, TEST_BCRYPT_ROUNDS);
}

export async function openTestDatabase(): Promise<DatabaseClient> {
  const db = await createDatabase(getTestDatabaseUrl());
  await resetTestDatabase(db);
  return db;
}
