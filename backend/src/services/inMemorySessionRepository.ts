import type { CreateSessionInput, StoredSession } from '../data/sessionRepository';
import type { ActiveSessionContext } from '../types/auth';
import type { StoredUser } from '../types/user';

type UserLookup = { findById(userId: string): Promise<StoredUser | null> };

export class InMemorySessionRepository {
  private readonly sessions = new Map<string, StoredSession>();

  constructor(private readonly userRepo: UserLookup) {}

  async create(input: CreateSessionInput): Promise<StoredSession> {
    const stored: StoredSession = { ...input, createdAt: new Date().toISOString() };
    this.sessions.set(stored.id, stored);
    return stored;
  }

  async findActiveByTokenHash(tokenHash: string, nowIso: string): Promise<ActiveSessionContext | null> {
    for (const session of this.sessions.values()) {
      if (session.tokenHash === tokenHash && session.expiresAt > nowIso) {
        const user = await this.userRepo.findById(session.userId);
        if (!user || !user.isActive) return null;
        return { sessionId: session.id, user };
      }
    }
    return null;
  }

  async deleteById(sessionId: string): Promise<void> {
    this.sessions.delete(sessionId);
  }

  async deleteOtherUserSessions(userId: string, keepSessionId: string): Promise<void> {
    for (const [id, session] of this.sessions.entries()) {
      if (session.userId === userId && id !== keepSessionId) this.sessions.delete(id);
    }
  }

  async deleteAllForUser(userId: string): Promise<void> {
    for (const [id, session] of this.sessions.entries()) {
      if (session.userId === userId) this.sessions.delete(id);
    }
  }

  countForUser(userId: string): number {
    return [...this.sessions.values()].filter((s) => s.userId === userId).length;
  }
}
