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
      seriesLinks: Map<number, Set<string>>;
      peopleLinks: Map<string, StoredCustomListPerson>;
    },
  ) {}

  async runTransaction<T>(fn: () => Promise<T>): Promise<T> {
    return fn();
  }

  async findSeriesMemberships(seriesIds: number[]): Promise<Map<number, StoredSeriesListMembership>> {
    const map = new Map<number, StoredSeriesListMembership>();
    const byId = new Map((await this.deps.userListRepo.listAllWithCounts()).map((l) => [l.id, l]));
    for (const id of seriesIds) {
      const row = await this.deps.watchlistRepo.findBySeriesId(id);
      const customLists = [...(this.deps.seriesLinks.get(id) ?? [])]
        .map((lid) => byId.get(lid))
        .filter((l): l is StoredUserList => Boolean(l));
      if (row || customLists.length > 0) {
        map.set(id, { primaryStatus: row?.status ?? null, customLists });
      }
    }
    return map;
  }

  async findPersonMemberships(personIds: number[]): Promise<Map<number, StoredUserList[]>> {
    const map = new Map<number, StoredUserList[]>();
    const byId = new Map((await this.deps.userListRepo.listAllWithCounts()).map((l) => [l.id, l]));
    for (const personId of personIds) {
      const lists = [...this.deps.peopleLinks.values()]
        .filter((p) => p.personId === personId)
        .map((p) => byId.get(p.listId))
        .filter((l): l is StoredUserList => Boolean(l));
      if (lists.length > 0) map.set(personId, lists);
    }
    return map;
  }

  async listSeriesByCustomListId(listId: string): Promise<StoredWatchlistRow[]> {
    const all = await this.deps.watchlistRepo.listAll();
    return all.filter((row) => this.deps.seriesLinks.get(row.seriesId)?.has(listId));
  }

  async listPeopleByCustomListId(listId: string): Promise<StoredCustomListPerson[]> {
    return [...this.deps.peopleLinks.values()].filter((p) => p.listId === listId);
  }

  async replaceSeriesCustomLists(input: { seriesId: number; listIds: string[] }): Promise<void> {
    this.deps.seriesLinks.set(input.seriesId, new Set(input.listIds));
  }

  async replacePersonCustomLists(input: { person: StoredPersonSnapshot; listIds: string[] }): Promise<void> {
    for (const [key, item] of this.deps.peopleLinks.entries()) {
      if (item.personId === input.person.personId) this.deps.peopleLinks.delete(key);
    }
    const now = new Date().toISOString();
    for (const listId of input.listIds) {
      this.deps.peopleLinks.set(`${listId}:${input.person.personId}`, { ...input.person, listId, addedAt: now });
    }
  }

  async removeSeriesFromCustomList(listId: string, seriesId: number): Promise<boolean> {
    return this.deps.seriesLinks.get(seriesId)?.delete(listId) ?? false;
  }

  async removePersonFromCustomList(listId: string, personId: number): Promise<boolean> {
    return this.deps.peopleLinks.delete(`${listId}:${personId}`);
  }
}
