import { PRIMARY_LIST_DEFAULTS } from '../config/listCatalog';
import type { StoredCustomListPerson } from '../data/listMembershipRepository';
import type { StoredUserList } from '../data/userListMapper';
import type { CreateStoredListInput, UpdateStoredListInput } from '../data/userListRepository';
import type { WatchlistRepository } from '../data/watchlistRepository';

function seedSystemLists(): Map<string, StoredUserList> {
  const map = new Map<string, StoredUserList>();
  const now = new Date().toISOString();
  for (const preset of PRIMARY_LIST_DEFAULTS) {
    map.set(preset.id, {
      id: preset.id, isSystem: true, systemKey: preset.id, entityType: 'series',
      name: preset.id, description: null, icon: preset.icon, color: preset.color,
      tags: [], itemCount: 0, createdAt: now, updatedAt: now,
    });
  }
  return map;
}

export class InMemoryUserListRepository {
  private readonly lists = seedSystemLists();
  constructor(
    private readonly watchlistRepo: WatchlistRepository,
    private readonly seriesLinks: Map<number, Set<string>>,
    private readonly peopleLinks: Map<string, StoredCustomListPerson>,
  ) {}

  async listAllWithCounts(): Promise<StoredUserList[]> {
    const tracked = await this.watchlistRepo.listAll();
    const out: StoredUserList[] = [];
    for (const list of this.lists.values()) {
      const itemCount = list.isSystem && list.systemKey
        ? tracked.filter((r) => r.status === list.systemKey).length
        : list.entityType === 'series'
          ? [...this.seriesLinks.values()].filter((set) => set.has(list.id)).length
          : [...this.peopleLinks.values()].filter((p) => p.listId === list.id).length;
      out.push({ ...list, itemCount });
    }
    return out;
  }

  async findById(listId: string): Promise<StoredUserList | null> {
    const all = await this.listAllWithCounts();
    return all.find((l) => l.id === listId) ?? null;
  }

  async findByLowerName(lowerName: string, excludeId?: string): Promise<StoredUserList | null> {
    return [...this.lists.values()].find((l) => l.name.toLowerCase() === lowerName && l.id !== excludeId) ?? null;
  }

  async create(input: CreateStoredListInput): Promise<StoredUserList> {
    const now = new Date().toISOString();
    const row: StoredUserList = { ...input, isSystem: false, systemKey: null, itemCount: 0, createdAt: now, updatedAt: now };
    this.lists.set(row.id, row);
    return row;
  }

  async update(listId: string, patch: UpdateStoredListInput): Promise<StoredUserList | null> {
    const existing = this.lists.get(listId);
    if (!existing) return null;
    this.lists.set(listId, {
      ...existing,
      name: patch.name ?? existing.name,
      description: patch.description === undefined ? existing.description : patch.description,
      icon: patch.icon ?? existing.icon,
      color: patch.color ?? existing.color,
      tags: patch.tags ?? existing.tags,
      updatedAt: new Date().toISOString(),
    });
    return this.findById(listId);
  }

  async deleteCustomById(listId: string): Promise<boolean> {
    const existing = this.lists.get(listId);
    if (!existing || existing.isSystem) return false;
    this.lists.delete(listId);
    for (const set of this.seriesLinks.values()) set.delete(listId);
    for (const [key, item] of this.peopleLinks.entries()) {
      if (item.listId === listId) this.peopleLinks.delete(key);
    }
    return true;
  }
}
