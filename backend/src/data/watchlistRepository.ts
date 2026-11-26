import type { DatabaseClient } from './database';
import type { WatchStatus } from '../types/watchlist';
import { mapWatchlistRow } from './watchlistRowMapper';

export type StoredWatchlistRow = {
  seriesId: number;
  name: string;
  localizedNamePtBr: string | null;
  imageUrl: string | null;
  status: WatchStatus;
  genres: string[];
  rating: number | null;
  totalEpisodes: number;
  tvmazeUrl: string;
  createdAt: string;
  updatedAt: string;
};

export type StoredWatchedEpisode = {
  seriesId: number;
  episodeId: number;
  seasonNumber: number;
  episodeNumber: number;
  watchedAt: string;
};

export type UpsertWatchlistInput = Omit<StoredWatchlistRow, 'createdAt' | 'updatedAt'>;

const UPSERT_SQL = `INSERT INTO watchlist_items (
  series_id, name, localized_name_pt_br, image_url, status, genres_json, rating, total_episodes, tvmaze_url, created_at, updated_at
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
ON CONFLICT(series_id) DO UPDATE SET
  name = excluded.name,
  localized_name_pt_br = COALESCE(excluded.localized_name_pt_br, watchlist_items.localized_name_pt_br),
  image_url = excluded.image_url,
  status = excluded.status,
  genres_json = excluded.genres_json,
  rating = excluded.rating,
  total_episodes = excluded.total_episodes,
  tvmaze_url = excluded.tvmaze_url,
  updated_at = excluded.updated_at`;

export class WatchlistRepository {
  constructor(private readonly db: DatabaseClient) {}

  async listAll(status?: WatchStatus): Promise<StoredWatchlistRow[]> {
    const query = status
      ? { sql: 'SELECT * FROM watchlist_items WHERE status = ? ORDER BY updated_at DESC', args: [status] }
      : { sql: 'SELECT * FROM watchlist_items ORDER BY updated_at DESC', args: [] };
    const result = await this.db.execute(query);
    return result.rows.map((row) => mapWatchlistRow(row as Record<string, unknown>));
  }

  async findBySeriesId(seriesId: number): Promise<StoredWatchlistRow | null> {
    const result = await this.db.execute({
      sql: 'SELECT * FROM watchlist_items WHERE series_id = ?',
      args: [seriesId],
    });
    const first = result.rows[0];
    return first ? mapWatchlistRow(first as Record<string, unknown>) : null;
  }

  async upsert(input: UpsertWatchlistInput): Promise<void> {
    const now = new Date().toISOString();
    await this.db.execute({
      sql: UPSERT_SQL,
      args: [
        input.seriesId, input.name, input.localizedNamePtBr, input.imageUrl,
        input.status, JSON.stringify(input.genres), input.rating,
        input.totalEpisodes, input.tvmazeUrl, now, now,
      ],
    });
  }

  async updateStatus(seriesId: number, status: WatchStatus): Promise<boolean> {
    const result = await this.db.execute({
      sql: 'UPDATE watchlist_items SET status = ?, updated_at = ? WHERE series_id = ?',
      args: [status, new Date().toISOString(), seriesId],
    });
    return result.rowsAffected > 0;
  }

  async deleteBySeriesId(seriesId: number): Promise<boolean> {
    const result = await this.db.execute({
      sql: 'DELETE FROM watchlist_items WHERE series_id = ?',
      args: [seriesId],
    });
    return result.rowsAffected > 0;
  }
}
