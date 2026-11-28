import type { PoolClient } from 'pg';
import type { WatchStatus } from '../types/watchlist';
import type { DatabaseClient } from './database';
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

export type UpsertWatchlistInput = Omit<StoredWatchlistRow, 'createdAt' | 'updatedAt'> & { userId: string };

const UPSERT_SQL = `INSERT INTO watchlist_items (
  user_id, series_id, name, localized_name_pt_br, image_url, status, genres, rating, total_episodes, tvmaze_url, created_at, updated_at
) VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8, $9, $10, $11, $12)
ON CONFLICT (user_id, series_id) DO UPDATE SET
  name = EXCLUDED.name,
  localized_name_pt_br = COALESCE(EXCLUDED.localized_name_pt_br, watchlist_items.localized_name_pt_br),
  image_url = EXCLUDED.image_url,
  status = EXCLUDED.status,
  genres = EXCLUDED.genres,
  rating = EXCLUDED.rating,
  total_episodes = EXCLUDED.total_episodes,
  tvmaze_url = EXCLUDED.tvmaze_url,
  updated_at = EXCLUDED.updated_at`;

export class WatchlistRepository {
  constructor(private readonly db: DatabaseClient) {}

  async listAll(userId: string, status?: WatchStatus): Promise<StoredWatchlistRow[]> {
    const result = status
      ? await this.db.query('SELECT * FROM watchlist_items WHERE user_id = $1 AND status = $2 ORDER BY updated_at DESC', [userId, status])
      : await this.db.query('SELECT * FROM watchlist_items WHERE user_id = $1 ORDER BY updated_at DESC', [userId]);
    return result.rows.map((row) => mapWatchlistRow(row as Record<string, unknown>));
  }

  async findBySeriesId(userId: string, seriesId: number): Promise<StoredWatchlistRow | null> {
    const result = await this.db.query('SELECT * FROM watchlist_items WHERE user_id = $1 AND series_id = $2', [userId, seriesId]);
    const first = result.rows[0];
    return first ? mapWatchlistRow(first as Record<string, unknown>) : null;
  }

  async upsert(input: UpsertWatchlistInput, dbClient?: PoolClient): Promise<void> {
    const runner = dbClient ?? this.db;
    const now = new Date().toISOString();
    await runner.query(UPSERT_SQL, [
      input.userId, input.seriesId, input.name, input.localizedNamePtBr, input.imageUrl,
      input.status, JSON.stringify(input.genres), input.rating,
      input.totalEpisodes, input.tvmazeUrl, now, now,
    ]);
  }

  async updateStatus(input: { userId: string; seriesId: number; status: WatchStatus }, dbClient?: PoolClient): Promise<boolean> {
    const runner = dbClient ?? this.db;
    const result = await runner.query(
      'UPDATE watchlist_items SET status = $1, updated_at = $2 WHERE user_id = $3 AND series_id = $4',
      [input.status, new Date().toISOString(), input.userId, input.seriesId],
    );
    return (result.rowCount ?? 0) > 0;
  }

  async deleteBySeriesId(userId: string, seriesId: number, dbClient?: PoolClient): Promise<boolean> {
    const runner = dbClient ?? this.db;
    const result = await runner.query('DELETE FROM watchlist_items WHERE user_id = $1 AND series_id = $2', [userId, seriesId]);
    return (result.rowCount ?? 0) > 0;
  }
}
