import type {
  StoredCustomListPerson,
  StoredPersonSnapshot,
  StoredSeriesListMembership,
} from '../data/listMembershipRepository';
import type { StoredUserList } from '../data/userListMapper';
import type { StoredWatchlistRow, WatchlistRepository } from '../data/watchlistRepository';
import type { InMemoryUserListRepository } from './inMemoryUserListRepository';

export class InMemoryListMembershipRepository {
  constructor(
    private readonly deps: {
      watchlistRepo: WatchlistRepository;
      userListRepo: InMemoryUserListRepository;
      seriesLinks: Map<string, Set<string>>;
      peopleLinks: Map<string, StoredCustomListPerson & { userId: string }>;
    },
  ) {}

  async runTransaction<T>(fn: () => Promise<T>): Promise<T> {
    return fn();
  }

  async findSeriesMemberships(userId: string, seriesIds: number[]): Promise<Map<number, StoredSeriesListMembership>> {
    const map = new Map<number, StoredSeriesListMembership>();
    const byId = new Map((await this.deps.userListRepo.listAllWithCounts(userId)).map((l) => [l.id, l]));
    for (const id of seriesIds) {
      const row = await this.deps.watchlistRepo.findBySeriesId(userId, id);
      const customLists = [...(this.deps.seriesLinks.get(`${userId}:${id}`) ?? [])]
        .map((lid) => byId.get(lid))
        .filter((l): l is StoredUserList => Boolean(l));
      if (row || customLists.length > 0) {
        map.set(id, { primaryStatus: row?.status ?? null, customLists });
      }
    }
    return map;
  }

  async findPersonMemberships(userId: string, personIds: number[]): Promise<Map<number, StoredUserList[]>> {
    const map = new Map<number, StoredUserList[]>();
    const byId = new Map((await this.deps.userListRepo.listAllWithCounts(userId)).map((l) => [l.id, l]));
    for (const personId of personIds) {
      const lists = [...this.deps.peopleLinks.values()]
        .filter((p) => p.userId === userId && p.personId === personId)
        .map((p) => byId.get(p.listId))
        .filter((l): l is StoredUserList => Boolean(l));
      if (lists.length > 0) map.set(personId, lists);
    }
    return map;
  }

  async listSeriesByCustomListId(userId: string, listId: string): Promise<StoredWatchlistRow[]> {
    const all = await this.deps.watchlistRepo.listAll(userId);
    return all.filter((row) => this.deps.seriesLinks.get(`${userId}:${row.seriesId}`)?.has(listId));
  }

  async listPeopleByCustomListId(userId: string, listId: string): Promise<StoredCustomListPerson[]> {
    return [...this.deps.peopleLinks.values()].filter((p) => p.userId === userId && p.listId === listId);
  }

  async replaceSeriesCustomLists(input: { userId: string; seriesId: number; listIds: string[] }): Promise<void> {
    this.deps.seriesLinks.set(`${input.userId}:${input.seriesId}`, new Set(input.listIds));
  }

  async replacePersonCustomLists(input: { userId: string; person: StoredPersonSnapshot; listIds: string[] }): Promise<void> {
    for (const [key, item] of this.deps.peopleLinks.entries()) {
      if (item.userId === input.userId && item.personId === input.person.personId) this.deps.peopleLinks.delete(key);
    }
    const now = new Date().toISOString();
    for (const listId of input.listIds) {
      this.deps.peopleLinks.set(`${input.userId}:${listId}:${input.person.personId}`, {
        ...input.person, userId: input.userId, listId, addedAt: now,
      });
    }
  }

  async removeSeriesFromCustomList(userId: string, listId: string, seriesId: number): Promise<boolean> {
    return this.deps.seriesLinks.get(`${userId}:${seriesId}`)?.delete(listId) ?? false;
  }

  async removePersonFromCustomList(userId: string, listId: string, personId: number): Promise<boolean> {
    return this.deps.peopleLinks.delete(`${userId}:${listId}:${personId}`);
  }
}
