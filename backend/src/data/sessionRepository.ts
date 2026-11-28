import { createHash } from 'node:crypto';
import type { ActiveSessionContext, UserRole } from '../types/auth';
import type { DatabaseClient } from './database';
import { toIsoTimestamp } from './watchlistRowMapper';

export type StoredSession = {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: string;
  createdAt: string;
};

export type CreateSessionInput = {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: string;
};

export function hashSessionToken(rawToken: string): string {
  return createHash('sha256').update(rawToken).digest('hex');
}

export class SessionRepository {
  constructor(private readonly db: DatabaseClient) {}

  async create(input: CreateSessionInput): Promise<StoredSession> {
    const now = new Date().toISOString();
    await this.db.query(
      `INSERT INTO user_sessions (id, user_id, token_hash, expires_at, created_at)
       VALUES ($1, $2, $3, $4, $5)`,
      [input.id, input.userId, input.tokenHash, input.expiresAt, now],
    );
    return { ...input, createdAt: now };
  }

  async findActiveByTokenHash(tokenHash: string, nowIso: string): Promise<ActiveSessionContext | null> {
    const result = await this.db.query(
      `SELECT s.id AS session_id, u.id, u.username, u.email, u.role, u.is_active, u.created_at
       FROM user_sessions s JOIN users u ON u.id = s.user_id
       WHERE s.token_hash = $1 AND s.expires_at > $2 AND u.is_active = TRUE LIMIT 1`,
      [tokenHash, nowIso],
    );
    const row = result.rows[0];
    if (!row) return null;
    return {
      sessionId: String(row.session_id),
      user: {
        id: String(row.id),
        username: String(row.username),
        email: String(row.email),
        role: String(row.role) as UserRole,
        isActive: Boolean(row.is_active),
        createdAt: toIsoTimestamp(row.created_at),
      },
    };
  }

  async deleteById(sessionId: string): Promise<void> {
    await this.db.query('DELETE FROM user_sessions WHERE id = $1', [sessionId]);
  }

  async deleteOtherUserSessions(userId: string, keepSessionId: string): Promise<void> {
    await this.db.query('DELETE FROM user_sessions WHERE user_id = $1 AND id <> $2', [userId, keepSessionId]);
  }

  async deleteAllForUser(userId: string): Promise<void> {
    await this.db.query('DELETE FROM user_sessions WHERE user_id = $1', [userId]);
  }
}
