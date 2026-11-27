import type { EpisodeMarkInput, WatchedEpisodeRepository } from '../data/watchedEpisodeRepository';
import type {
  StoredWatchedEpisode,
  StoredWatchlistRow,
  UpsertWatchlistInput,
  WatchlistRepository,
} from '../data/watchlistRepository';
import type { WatchStatus } from '../types/watchlist';

class InMemoryWatchlistRepository {
  private readonly items = new Map<number, StoredWatchlistRow>();

  async listAll(status?: WatchStatus): Promise<StoredWatchlistRow[]> {
    const rows = [...this.items.values()];
    const filtered = status ? rows.filter((row) => row.status === status) : rows;
    return filtered.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  async findBySeriesId(seriesId: number): Promise<StoredWatchlistRow | null> {
    return this.items.get(seriesId) ?? null;
  }

  async upsert(input: UpsertWatchlistInput): Promise<void> {
    const now = new Date().toISOString();
    const existing = this.items.get(input.seriesId);
    this.items.set(input.seriesId, {
      ...input,
      localizedNamePtBr: input.localizedNamePtBr ?? existing?.localizedNamePtBr ?? null,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    });
  }

  async updateStatus(seriesId: number, status: WatchStatus): Promise<boolean> {
    const existing = this.items.get(seriesId);
    if (!existing) {
      return false;
    }
    this.items.set(seriesId, { ...existing, status, updatedAt: new Date().toISOString() });
    return true;
  }

  async deleteBySeriesId(seriesId: number): Promise<boolean> {
    return this.items.delete(seriesId);
  }
}

class InMemoryWatchedEpisodeRepository {
  private readonly episodes = new Map<string, StoredWatchedEpisode>();

  async listBySeriesId(seriesId: number): Promise<StoredWatchedEpisode[]> {
    return [...this.episodes.values()]
      .filter((ep) => ep.seriesId === seriesId)
      .sort((a, b) => a.seasonNumber - b.seasonNumber || a.episodeNumber - b.episodeNumber);
  }

  async listAllCounts(): Promise<Map<number, number>> {
    const counts = new Map<number, number>();
    for (const ep of this.episodes.values()) {
      counts.set(ep.seriesId, (counts.get(ep.seriesId) ?? 0) + 1);
    }
    return counts;
  }

  async markEpisodes(entries: EpisodeMarkInput[]): Promise<void> {
    const now = new Date().toISOString();
    for (const entry of entries) {
      const key = `${entry.seriesId}:${entry.episodeId}`;
      if (!this.episodes.has(key)) {
        this.episodes.set(key, { ...entry, watchedAt: now });
      }
    }
  }

  async unmarkEpisodes(seriesId: number, episodeIds: number[]): Promise<void> {
    for (const episodeId of episodeIds) {
      this.episodes.delete(`${seriesId}:${episodeId}`);
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
