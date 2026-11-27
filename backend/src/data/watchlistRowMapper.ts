import type { WatchStatus } from '../types/watchlist';
import type { StoredWatchlistRow } from './watchlistRepository';

function parseGenres(raw: unknown): string[] {
  if (Array.isArray(raw)) {
    return raw.map((item) => String(item));
  }
  if (typeof raw === 'string') {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map((item) => String(item)) : [];
  }
  return [];
}

export function toIsoTimestamp(value: unknown): string {
  if (value instanceof Date) {
    return value.toISOString();
  }
  return String(value);
}

export function mapWatchlistRow(row: Record<string, unknown>): StoredWatchlistRow {
  return {
    seriesId: Number(row.series_id),
    name: String(row.name),
    localizedNamePtBr: row.localized_name_pt_br === null ? null : String(row.localized_name_pt_br),
    imageUrl: row.image_url === null ? null : String(row.image_url),
    status: String(row.status) as WatchStatus,
    genres: parseGenres(row.genres),
    rating: row.rating === null ? null : Number(row.rating),
    totalEpisodes: Number(row.total_episodes ?? 0),
    tvmazeUrl: String(row.tvmaze_url),
    createdAt: toIsoTimestamp(row.created_at),
    updatedAt: toIsoTimestamp(row.updated_at),
  };
}
