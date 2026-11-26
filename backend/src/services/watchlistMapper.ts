import type { StoredWatchlistRow } from '../data/watchlistRepository';
import type { Locale } from '../types/locale';
import type { TvmazeEpisode } from '../types/tvmaze';
import type { EpisodePointer, WatchStatus, WatchlistItem } from '../types/watchlist';

const MAX_PERCENT = 100;

export type WatchlistItemInput = {
  row: StoredWatchlistRow;
  watchedEpisodes: number;
  locale: Locale;
  nextEpisode?: EpisodePointer | null;
};

export function computeSyncedStatus(
  currentStatus: WatchStatus,
  watchedCount: number,
  totalEpisodes: number,
): WatchStatus {
  if (totalEpisodes > 0 && watchedCount >= totalEpisodes) {
    return 'watched';
  }
  if (currentStatus === 'want_to_watch' && watchedCount > 0) {
    return 'watching';
  }
  if (currentStatus === 'watched' && watchedCount < totalEpisodes) {
    return 'watching';
  }
  return currentStatus;
}

export function findNextEpisode(
  episodes: TvmazeEpisode[],
  watchedIds: Set<number>,
): EpisodePointer | null {
  const sorted = [...episodes].sort((a, b) => a.season - b.season || (a.number ?? 0) - (b.number ?? 0));
  const nextRaw = sorted.find((ep) => !watchedIds.has(ep.id));
  if (!nextRaw) {
    return null;
  }
  return {
    id: nextRaw.id,
    season: nextRaw.season,
    number: nextRaw.number ?? 0,
    name: nextRaw.name,
    airdate: nextRaw.airdate ?? null,
  };
}

export function mapWatchlistItem(input: WatchlistItemInput): WatchlistItem {
  const { row, watchedEpisodes } = input;
  const progressPercent = row.totalEpisodes > 0
    ? Math.min(MAX_PERCENT, Math.round((watchedEpisodes / row.totalEpisodes) * MAX_PERCENT))
    : 0;
  return {
    seriesId: row.seriesId,
    name: row.name,
    localizedName: input.locale === 'pt-BR' ? row.localizedNamePtBr : null,
    imageUrl: row.imageUrl,
    status: row.status,
    genres: row.genres,
    rating: row.rating,
    watchedEpisodes,
    totalEpisodes: row.totalEpisodes,
    progressPercent,
    nextEpisode: input.nextEpisode ?? null,
    tvmazeUrl: row.tvmazeUrl,
    updatedAt: row.updatedAt,
  };
}
