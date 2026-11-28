import type { CreateStoredUserInput, StoredUser, UpdateStoredUserPatch } from '../types/user';
import type { DatabaseClient } from './database';
import { ensurePrimaryListsForUser } from './initialAdminSeed';
import { mapUserRow, toPublicUser } from './userRowMapper';

export { toPublicUser };

export class UserRepository {
  constructor(private readonly db: DatabaseClient) {}

  async findById(userId: string): Promise<StoredUser | null> {
    const result = await this.db.query('SELECT * FROM users WHERE id = $1', [userId]);
    return result.rows[0] ? mapUserRow(result.rows[0] as Record<string, unknown>) : null;
  }

  async findByIdentifier(normalizedIdentifier: string): Promise<StoredUser | null> {
    const result = await this.db.query(
      'SELECT * FROM users WHERE LOWER(username) = $1 OR LOWER(email) = $1 LIMIT 1',
      [normalizedIdentifier],
    );
    return result.rows[0] ? mapUserRow(result.rows[0] as Record<string, unknown>) : null;
  }

  async findByLowerUsername(lowerUsername: string): Promise<StoredUser | null> {
    const result = await this.db.query('SELECT * FROM users WHERE LOWER(username) = $1 LIMIT 1', [lowerUsername]);
    return result.rows[0] ? mapUserRow(result.rows[0] as Record<string, unknown>) : null;
  }

  async findByLowerEmail(lowerEmail: string): Promise<StoredUser | null> {
    const result = await this.db.query('SELECT * FROM users WHERE LOWER(email) = $1 LIMIT 1', [lowerEmail]);
    return result.rows[0] ? mapUserRow(result.rows[0] as Record<string, unknown>) : null;
  }

  async listAll(): Promise<StoredUser[]> {
    const result = await this.db.query('SELECT * FROM users ORDER BY role ASC, LOWER(username) ASC');
    return result.rows.map((row) => mapUserRow(row as Record<string, unknown>));
  }

  async countActiveAdmins(): Promise<number> {
    const result = await this.db.query("SELECT COUNT(*) AS count FROM users WHERE role = 'ADMIN' AND is_active = TRUE");
    return Number(result.rows[0]?.count ?? 0);
  }

  async createWithPrimaryLists(input: CreateStoredUserInput): Promise<StoredUser> {
    const client = await this.db.connect();
    try {
      await client.query('BEGIN');
      const now = new Date().toISOString();
      const inserted = await client.query(
        `INSERT INTO users (id, username, email, client_salt, password_hash, role, is_active, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, TRUE, $7, $8) RETURNING *`,
        [input.id, input.username, input.email, input.clientSalt, input.passwordHash, input.role, now, now],
      );
      await ensurePrimaryListsForUser(client, input.id);
      await client.query('COMMIT');
      return mapUserRow(inserted.rows[0] as Record<string, unknown>);
    } catch (error: unknown) {
      await client.query('ROLLBACK').catch(() => undefined);
      throw error;
    } finally {
      client.release();
    }
  }

  async updateAccount(userId: string, patch: UpdateStoredUserPatch): Promise<StoredUser | null> {
    const existing = await this.findById(userId);
    if (!existing) return null;
    const result = await this.db.query(
      'UPDATE users SET role = $1, is_active = $2, updated_at = $3 WHERE id = $4 RETURNING *',
      [patch.role ?? existing.role, patch.isActive ?? existing.isActive, new Date().toISOString(), userId],
    );
    return result.rows[0] ? mapUserRow(result.rows[0] as Record<string, unknown>) : null;
  }

  async updateCredentials(userId: string, creds: { clientSalt: string; passwordHash: string }): Promise<boolean> {
    const result = await this.db.query(
      'UPDATE users SET client_salt = $1, password_hash = $2, updated_at = $3 WHERE id = $4',
      [creds.clientSalt, creds.passwordHash, new Date().toISOString(), userId],
    );
    return (result.rowCount ?? 0) > 0;
  }

  async deleteById(userId: string): Promise<boolean> {
    const result = await this.db.query('DELETE FROM users WHERE id = $1', [userId]);
    return (result.rowCount ?? 0) > 0;
  }
}
