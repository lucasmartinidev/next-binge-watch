import bcrypt from 'bcryptjs';
import { randomUUID } from 'node:crypto';
import { loadAuthConfig } from '../config/authConfig';
import { getPrimaryListCopy, PRIMARY_LIST_DEFAULTS } from '../config/listCatalog';
import type { DatabaseClient } from './database';

type QueryRunner = Pick<DatabaseClient, 'query'>;
const DEFAULT_BCRYPT_ROUNDS = 10;

export async function ensurePrimaryListsForUser(runner: QueryRunner, userId: string): Promise<void> {
  const now = new Date().toISOString();
  for (const preset of PRIMARY_LIST_DEFAULTS) {
    const copy = getPrimaryListCopy(preset.id, 'en');
    await runner.query(
      `INSERT INTO user_lists (id, user_id, is_system, system_key, entity_type, name, description, icon, color, tags, created_at, updated_at)
       VALUES ($1, $2, TRUE, $3, 'series', $4, $5, $6, $7, '[]'::jsonb, $8, $9)
       ON CONFLICT (user_id, system_key) WHERE system_key IS NOT NULL DO NOTHING`,
      [randomUUID(), userId, preset.id, copy.name, copy.description, preset.icon, preset.color, now, now],
    );
  }
}

export async function seedInitialAdmin(runner: QueryRunner, rounds = DEFAULT_BCRYPT_ROUNDS): Promise<string> {
  const { initialAdmin } = loadAuthConfig();
  const existing = await runner.query('SELECT id FROM users WHERE LOWER(email) = $1 LIMIT 1', [
    initialAdmin.email.toLowerCase(),
  ]);
  if (existing.rows[0]) {
    const userId = String(existing.rows[0].id);
    await ensurePrimaryListsForUser(runner, userId);
    return userId;
  }
  const userId = randomUUID();
  const clientSalt = await bcrypt.genSalt(rounds);
  const clientHash = await bcrypt.hash(initialAdmin.password, clientSalt);
  const passwordHash = await bcrypt.hash(clientHash, rounds);
  await runner.query(
    `INSERT INTO users (id, username, email, client_salt, password_hash, role, is_active)
     VALUES ($1, $2, $3, $4, $5, $6, TRUE)`,
    [userId, initialAdmin.username, initialAdmin.email.toLowerCase(), clientSalt, passwordHash, initialAdmin.role],
  );
  await ensurePrimaryListsForUser(runner, userId);
  return userId;
}
