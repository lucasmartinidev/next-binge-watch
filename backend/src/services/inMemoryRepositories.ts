import type { EpisodeMarkInput, WatchedEpisodeRepository } from '../data/watchedEpisodeRepository';
import type {
  StoredWatchedEpisode,
  StoredWatchlistRow,
  UpsertWatchlistInput,
  WatchlistRepository,
} from '../data/watchlistRepository';
import type { WatchStatus } from '../types/watchlist';

class InMemoryWatchlistRepository {
  private readonly items = new Map<string, StoredWatchlistRow & { userId: string }>();

  async listAll(userId: string, status?: WatchStatus): Promise<StoredWatchlistRow[]> {
    const rows = [...this.items.values()].filter((row) => row.userId === userId);
    const filtered = status ? rows.filter((row) => row.status === status) : rows;
    return filtered.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  async findBySeriesId(userId: string, seriesId: number): Promise<StoredWatchlistRow | null> {
    return this.items.get(`${userId}:${seriesId}`) ?? null;
  }

  async upsert(input: UpsertWatchlistInput): Promise<void> {
    const now = new Date().toISOString();
    const key = `${input.userId}:${input.seriesId}`;
    const existing = this.items.get(key);
    this.items.set(key, {
      ...input,
      localizedNamePtBr: input.localizedNamePtBr ?? existing?.localizedNamePtBr ?? null,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    });
  }

  async updateStatus(input: { userId: string; seriesId: number; status: WatchStatus }): Promise<boolean> {
    const key = `${input.userId}:${input.seriesId}`;
    const existing = this.items.get(key);
    if (!existing) return false;
    this.items.set(key, { ...existing, status: input.status, updatedAt: new Date().toISOString() });
    return true;
  }

  async deleteBySeriesId(userId: string, seriesId: number): Promise<boolean> {
    return this.items.delete(`${userId}:${seriesId}`);
  }
}

class InMemoryWatchedEpisodeRepository {
  private readonly episodes = new Map<string, StoredWatchedEpisode & { userId: string }>();

  async listBySeriesId(userId: string, seriesId: number): Promise<StoredWatchedEpisode[]> {
    return [...this.episodes.values()]
      .filter((ep) => ep.userId === userId && ep.seriesId === seriesId)
      .sort((a, b) => a.seasonNumber - b.seasonNumber || a.episodeNumber - b.episodeNumber);
  }

  async listAllCounts(userId: string): Promise<Map<number, number>> {
    const counts = new Map<number, number>();
    for (const ep of this.episodes.values()) {
      if (ep.userId === userId) counts.set(ep.seriesId, (counts.get(ep.seriesId) ?? 0) + 1);
    }
    return counts;
  }

  async markEpisodes(entries: EpisodeMarkInput[]): Promise<void> {
    const now = new Date().toISOString();
    for (const entry of entries) {
      const key = `${entry.userId}:${entry.seriesId}:${entry.episodeId}`;
      if (!this.episodes.has(key)) this.episodes.set(key, { ...entry, watchedAt: now });
    }
  }

  async unmarkEpisodes(userId: string, seriesId: number, episodeIds: number[]): Promise<void> {
    for (const episodeId of episodeIds) {
      this.episodes.delete(`${userId}:${seriesId}:${episodeId}`);
    }
  }
}

export function createInMemoryRepositories(): {
  watchlistRepo: WatchlistRepository;
  episodeRepo: WatchedEpisodeRepository;
} {
  return {
    watchlistRepo: new InMemoryWatchlistRepository() as unknown as WatchlistRepository,
    episodeRepo: new InMemoryWatchedEpisodeRepository() as unknown as WatchedEpisodeRepository,
  };
}
