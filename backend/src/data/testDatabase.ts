import 'dotenv/config';
import { PRIMARY_LIST_DEFAULTS } from '../config/listCatalog';
import { createDatabase, type DatabaseClient } from './database';

export function getTestDatabaseUrl(): string {
  const url = process.env.TEST_DATABASE_URL?.trim();
  if (!url) {
    throw new Error('TEST_DATABASE_URL is required to run PostgreSQL integration tests');
  }
  return url;
}

export async function resetTestDatabase(db: DatabaseClient): Promise<void> {
  await db.query(
    'TRUNCATE TABLE custom_list_series, custom_list_people, watched_episodes, watchlist_items, user_preferences CASCADE',
  );
  await db.query('DELETE FROM user_lists WHERE is_system = FALSE');
  for (const preset of PRIMARY_LIST_DEFAULTS) {
    await db.query('UPDATE user_lists SET icon = $1, color = $2 WHERE id = $3', [
      preset.icon,
      preset.color,
      preset.id,
    ]);
  }
}

export async function openTestDatabase(): Promise<DatabaseClient> {
  const db = await createDatabase(getTestDatabaseUrl());
  await resetTestDatabase(db);
  return db;
}
