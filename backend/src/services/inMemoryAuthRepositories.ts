import type { CreateStoredUserInput, StoredUser, UpdateStoredUserPatch } from '../types/user';
import { InMemorySessionRepository } from './inMemorySessionRepository';

export { InMemorySessionRepository };

export class InMemoryUserRepository {
  private readonly users = new Map<string, StoredUser>();
  public readonly provisionedPrimaryListsFor: string[] = [];

  async findById(userId: string): Promise<StoredUser | null> {
    return this.users.get(userId) ?? null;
  }

  async findByIdentifier(normalizedIdentifier: string): Promise<StoredUser | null> {
    for (const user of this.users.values()) {
      if (user.username.toLowerCase() === normalizedIdentifier || user.email.toLowerCase() === normalizedIdentifier) return user;
    }
    return null;
  }

  async findByLowerUsername(lowerUsername: string): Promise<StoredUser | null> {
    for (const user of this.users.values()) {
      if (user.username.toLowerCase() === lowerUsername) return user;
    }
    return null;
  }

  async findByLowerEmail(lowerEmail: string): Promise<StoredUser | null> {
    for (const user of this.users.values()) {
      if (user.email.toLowerCase() === lowerEmail) return user;
    }
    return null;
  }

  async listAll(): Promise<StoredUser[]> {
    return [...this.users.values()].sort((a, b) => a.username.localeCompare(b.username));
  }

  async countActiveAdmins(): Promise<number> {
    return [...this.users.values()].filter((u) => u.role === 'ADMIN' && u.isActive).length;
  }

  async createWithPrimaryLists(input: CreateStoredUserInput): Promise<StoredUser> {
    const now = new Date().toISOString();
    const user: StoredUser = { ...input, isActive: true, createdAt: now, updatedAt: now };
    this.users.set(user.id, user);
    this.provisionedPrimaryListsFor.push(user.id);
    return user;
  }

  async updateAccount(userId: string, patch: UpdateStoredUserPatch): Promise<StoredUser | null> {
    const existing = this.users.get(userId);
    if (!existing) return null;
    const updated: StoredUser = {
      ...existing,
      role: patch.role ?? existing.role,
      isActive: patch.isActive ?? existing.isActive,
      updatedAt: new Date().toISOString(),
    };
    this.users.set(userId, updated);
    return updated;
  }

  async updateCredentials(userId: string, creds: { clientSalt: string; passwordHash: string }): Promise<boolean> {
    const existing = this.users.get(userId);
    if (!existing) return false;
    this.users.set(userId, { ...existing, ...creds, updatedAt: new Date().toISOString() });
    return true;
  }

  async deleteById(userId: string): Promise<boolean> {
    return this.users.delete(userId);
  }
}
