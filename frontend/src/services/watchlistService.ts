import { apiRequest } from './apiClient';
import type { Locale } from '@/types/locale';
import type {
  SeriesTrackingState,
  WatchStatus,
  WatchlistFilter,
  WatchlistItem,
  WatchlistResponse,
} from '@/types/watchlist';

export function getWatchlist(input: {
  status: WatchlistFilter;
  locale: Locale;
  signal?: AbortSignal;
}): Promise<WatchlistResponse> {
  const query = input.status === 'all' ? '' : `?status=${input.status}`;
  return apiRequest<WatchlistResponse>(`/api/watchlist${query}`, {
    locale: input.locale,
    signal: input.signal,
  });
}

export function addToWatchlist(input: {
  seriesId: number;
  status: WatchStatus;
  locale: Locale;
}): Promise<WatchlistItem> {
  return apiRequest<WatchlistItem>('/api/watchlist', {
    method: 'POST',
    locale: input.locale,
    body: { seriesId: input.seriesId, status: input.status },
  });
}

export function updateWatchStatus(input: {
  seriesId: number;
  status: WatchStatus;
  locale: Locale;
}): Promise<WatchlistItem> {
  return apiRequest<WatchlistItem>(`/api/watchlist/${input.seriesId}`, {
    method: 'PATCH',
    locale: input.locale,
    body: { status: input.status },
  });
}

export function removeFromWatchlist(seriesId: number, locale: Locale): Promise<void> {
  return apiRequest<void>(`/api/watchlist/${seriesId}`, { method: 'DELETE', locale });
}

export function toggleEpisodeWatched(input: {
  seriesId: number;
  episodeId: number;
  watched: boolean;
  locale: Locale;
}): Promise<SeriesTrackingState> {
  return apiRequest<SeriesTrackingState>(
    `/api/watchlist/${input.seriesId}/episodes/${input.episodeId}`,
    { method: 'PUT', locale: input.locale, body: { watched: input.watched } },
  );
}

export function toggleSeasonWatched(input: {
  seriesId: number;
  seasonNumber: number;
  watched: boolean;
  locale: Locale;
}): Promise<SeriesTrackingState> {
  return apiRequest<SeriesTrackingState>(
    `/api/watchlist/${input.seriesId}/seasons/${input.seasonNumber}`,
    { method: 'PUT', locale: input.locale, body: { watched: input.watched } },
  );
}
