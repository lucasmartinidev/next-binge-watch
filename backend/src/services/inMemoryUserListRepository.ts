import { PRIMARY_LIST_DEFAULTS } from '../config/listCatalog';
import type { StoredCustomListPerson } from '../data/listMembershipRepository';
import type { StoredUserList } from '../data/userListMapper';
import type { CreateStoredListInput, UpdateStoredListInput } from '../data/userListRepository';
import type { WatchlistRepository } from '../data/watchlistRepository';

export class InMemoryUserListRepository {
  private readonly lists = new Map<string, StoredUserList & { userId: string }>();
  constructor(
    private readonly watchlistRepo: WatchlistRepository,
    private readonly seriesLinks: Map<string, Set<string>>,
    private readonly peopleLinks: Map<string, StoredCustomListPerson & { userId: string }>,
  ) {}

  private ensureSeeded(userId: string): void {
    const hasSeed = [...this.lists.values()].some((l) => l.userId === userId && l.isSystem);
    if (hasSeed) return;
    const now = new Date().toISOString();
    for (const preset of PRIMARY_LIST_DEFAULTS) {
      const id = `${userId}:${preset.id}`;
      this.lists.set(id, {
        id, userId, isSystem: true, systemKey: preset.id, entityType: 'series',
        name: preset.id, description: null, icon: preset.icon, color: preset.color,
        tags: [], itemCount: 0, createdAt: now, updatedAt: now,
      });
    }
  }

  async listAllWithCounts(userId: string): Promise<StoredUserList[]> {
    this.ensureSeeded(userId);
    const tracked = await this.watchlistRepo.listAll(userId);
    const out: StoredUserList[] = [];
    for (const list of this.lists.values()) {
      if (list.userId !== userId) continue;
      const itemCount = list.isSystem && list.systemKey
        ? tracked.filter((r) => r.status === list.systemKey).length
        : list.entityType === 'series'
          ? [...this.seriesLinks.entries()].filter(([k, set]) => k.startsWith(`${userId}:`) && set.has(list.id)).length
          : [...this.peopleLinks.values()].filter((p) => p.userId === userId && p.listId === list.id).length;
      out.push({ ...list, itemCount });
    }
    return out;
  }

  async findById(userId: string, listId: string): Promise<StoredUserList | null> {
    const all = await this.listAllWithCounts(userId);
    return all.find((l) => l.id === listId || l.systemKey === listId) ?? null;
  }

  async findByLowerName(userId: string, lowerName: string, excludeId?: string): Promise<StoredUserList | null> {
    this.ensureSeeded(userId);
    return [...this.lists.values()].find((l) => l.userId === userId && l.name.toLowerCase() === lowerName && l.id !== excludeId) ?? null;
  }

  async create(input: CreateStoredListInput): Promise<StoredUserList> {
    this.ensureSeeded(input.userId);
    const now = new Date().toISOString();
    const row = { ...input, isSystem: false, systemKey: null, itemCount: 0, createdAt: now, updatedAt: now };
    this.lists.set(row.id, row);
    return row;
  }

  async update(userId: string, listId: string, patch: UpdateStoredListInput): Promise<StoredUserList | null> {
    const existing = await this.findById(userId, listId);
    if (!existing) return null;
    this.lists.set(existing.id, {
      ...existing, userId,
      name: patch.name ?? existing.name,
      description: patch.description === undefined ? existing.description : patch.description,
      icon: patch.icon ?? existing.icon, color: patch.color ?? existing.color,
      tags: patch.tags ?? existing.tags, updatedAt: new Date().toISOString(),
    });
    return this.findById(userId, existing.id);
  }

  async deleteCustomById(userId: string, listId: string): Promise<boolean> {
    const existing = await this.findById(userId, listId);
    if (!existing || existing.isSystem) return false;
    this.lists.delete(existing.id);
    for (const [k, set] of this.seriesLinks.entries()) {
      if (k.startsWith(`${userId}:`)) set.delete(existing.id);
    }
    for (const [key, item] of this.peopleLinks.entries()) {
      if (item.userId === userId && item.listId === existing.id) this.peopleLinks.delete(key);
    }
    return true;
  }
}
