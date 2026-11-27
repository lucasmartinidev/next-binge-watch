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

export type UpsertWatchlistInput = Omit<StoredWatchlistRow, 'createdAt' | 'updatedAt'>;

const UPSERT_SQL = `INSERT INTO watchlist_items (
  series_id, name, localized_name_pt_br, image_url, status, genres, rating, total_episodes, tvmaze_url, created_at, updated_at
) VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7, $8, $9, $10, $11)
ON CONFLICT (series_id) DO UPDATE SET
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

  async listAll(status?: WatchStatus): Promise<StoredWatchlistRow[]> {
    const result = status
      ? await this.db.query('SELECT * FROM watchlist_items WHERE status = $1 ORDER BY updated_at DESC', [status])
      : await this.db.query('SELECT * FROM watchlist_items ORDER BY updated_at DESC');
    return result.rows.map((row) => mapWatchlistRow(row as Record<string, unknown>));
  }

  async findBySeriesId(seriesId: number): Promise<StoredWatchlistRow | null> {
    const result = await this.db.query('SELECT * FROM watchlist_items WHERE series_id = $1', [seriesId]);
    const first = result.rows[0];
    return first ? mapWatchlistRow(first as Record<string, unknown>) : null;
  }

  async upsert(input: UpsertWatchlistInput): Promise<void> {
    const now = new Date().toISOString();
    await this.db.query(UPSERT_SQL, [
      input.seriesId, input.name, input.localizedNamePtBr, input.imageUrl,
      input.status, JSON.stringify(input.genres), input.rating,
      input.totalEpisodes, input.tvmazeUrl, now, now,
    ]);
  }

  async updateStatus(seriesId: number, status: WatchStatus): Promise<boolean> {
    const result = await this.db.query(
      'UPDATE watchlist_items SET status = $1, updated_at = $2 WHERE series_id = $3',
      [status, new Date().toISOString(), seriesId],
    );
    return (result.rowCount ?? 0) > 0;
  }

  async deleteBySeriesId(seriesId: number): Promise<boolean> {
    const result = await this.db.query('DELETE FROM watchlist_items WHERE series_id = $1', [seriesId]);
    return (result.rowCount ?? 0) > 0;
  }
}
