import type { WatchStatus } from '../types/watchlist';
import type { StoredWatchlistRow } from './watchlistRepository';

export function mapWatchlistRow(row: Record<string, unknown>): StoredWatchlistRow {
  return {
    seriesId: Number(row.series_id),
    name: String(row.name),
    localizedNamePtBr: row.localized_name_pt_br === null ? null : String(row.localized_name_pt_br),
    imageUrl: row.image_url === null ? null : String(row.image_url),
    status: String(row.status) as WatchStatus,
    genres: JSON.parse(String(row.genres_json ?? '[]')) as string[],
    rating: row.rating === null ? null : Number(row.rating),
    totalEpisodes: Number(row.total_episodes ?? 0),
    tvmazeUrl: String(row.tvmaze_url),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}
