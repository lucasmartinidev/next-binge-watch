import { mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';
import { createClient, type Client } from '@libsql/client';

const SCHEMA_STATEMENTS = [
  'PRAGMA foreign_keys = ON;',
  `CREATE TABLE IF NOT EXISTS watchlist_items (
    series_id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    localized_name_pt_br TEXT,
    image_url TEXT,
    status TEXT NOT NULL CHECK (status IN ('want_to_watch', 'watching', 'watched')),
    genres_json TEXT NOT NULL DEFAULT '[]',
    rating REAL,
    total_episodes INTEGER NOT NULL DEFAULT 0,
    tvmaze_url TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );`,
  `CREATE TABLE IF NOT EXISTS watched_episodes (
    series_id INTEGER NOT NULL,
    episode_id INTEGER NOT NULL,
    season_number INTEGER NOT NULL,
    episode_number INTEGER NOT NULL,
    watched_at TEXT NOT NULL,
    PRIMARY KEY (series_id, episode_id),
    FOREIGN KEY (series_id) REFERENCES watchlist_items(series_id) ON DELETE CASCADE
  );`,
  `CREATE TABLE IF NOT EXISTS user_preferences (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );`,
];

export type DatabaseClient = Client;

async function ensureDirectoryExists(databaseUrl: string): Promise<void> {
  if (!databaseUrl.startsWith('file:')) {
    return;
  }
  const filePath = databaseUrl.slice('file:'.length);
  if (!filePath || filePath === ':memory:') {
    return;
  }
  await mkdir(dirname(filePath), { recursive: true });
}

export async function createDatabase(databaseUrl: string): Promise<DatabaseClient> {
  await ensureDirectoryExists(databaseUrl);
  const client = createClient({ url: databaseUrl });
  for (const statement of SCHEMA_STATEMENTS) {
    await client.execute(statement);
  }
  return client;
}

export async function pingDatabase(client: DatabaseClient): Promise<boolean> {
  try {
    await client.execute('SELECT 1');
    return true;
  } catch {
    return false;
  }
}

export async function closeDatabase(client: DatabaseClient): Promise<void> {
  client.close();
}
