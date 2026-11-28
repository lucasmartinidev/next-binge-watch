import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { loadAuthConfig } from '../config/authConfig';
import { closeDatabase, type DatabaseClient } from './database';
import { openTestDatabase, resetTestDatabase } from './testDatabase';

describe('User Authentication Migration & Seed (IT-01)', () => {
  let db: DatabaseClient;

  beforeAll(async () => {
    db = await openTestDatabase();
  });

  afterAll(async () => {
    await closeDatabase(db);
  });

  it('seeds initial ADMIN from env config with UUID and 3 primary lists', async () => {
    const adminId = await resetTestDatabase(db);
    const { initialAdmin } = loadAuthConfig();
    const userRes = await db.query('SELECT id, username, email, role, is_active FROM users WHERE id = $1', [adminId]);
    expect(userRes.rows).toHaveLength(1);
    expect(userRes.rows[0]).toMatchObject({
      id: adminId,
      username: initialAdmin.username,
      email: initialAdmin.email.toLowerCase(),
      role: initialAdmin.role,
      is_active: true,
    });
    const listRes = await db.query('SELECT system_key, is_system FROM user_lists WHERE user_id = $1 ORDER BY system_key', [
      adminId,
    ]);
    expect(listRes.rows.map((r) => r.system_key)).toEqual(['want_to_watch', 'watched', 'watching']);
  });

  it('enforces user_id foreign keys and composite primary keys across watchlist tables', async () => {
    const adminId = await resetTestDatabase(db);
    await db.query(
      `INSERT INTO watchlist_items (user_id, series_id, name, status, tvmaze_url)
       VALUES ($1, 101, 'Severance', 'watching', 'https://www.tvmaze.com/shows/101')`,
      [adminId],
    );
    await db.query(
      `INSERT INTO watched_episodes (user_id, series_id, episode_id, season_number, episode_number)
       VALUES ($1, 101, 5001, 1, 1)`,
      [adminId],
    );
    const epRes = await db.query('SELECT user_id, series_id, episode_id FROM watched_episodes WHERE user_id = $1', [adminId]);
    expect(epRes.rows).toHaveLength(1);
  });
});
