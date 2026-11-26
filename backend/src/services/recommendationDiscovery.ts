import type { StoredWatchlistRow } from '../data/watchlistRepository';
import { formatGenreDiscoveryReason, formatTopRatedReason } from '../i18n/recommendationMessages';
import type { Locale } from '../types/locale';
import type { NextBingeRecommendation } from '../types/recommendation';
import type { TvmazeShow } from '../types/tvmaze';
import { stripHtml } from './htmlSanitizer';

const GENRE_MATCH_WEIGHT = 100;
const MAX_DISCOVERY_PICKS = 10;

export type DiscoveryInput = {
  catalog: TvmazeShow[];
  trackedIds: Set<number>;
  excludeSet: Set<number>;
  preferredGenres: Set<string>;
  locale: Locale;
};

export function extractPreferredGenres(saved: StoredWatchlistRow[]): Set<string> {
  const genres = new Set<string>();
  for (const row of saved) {
    if (row.status === 'watching' || row.status === 'watched') {
      row.genres.forEach((genre) => genres.add(genre));
    }
  }
  return genres;
}

function scoreShow(show: TvmazeShow, preferredGenres: Set<string>): number {
  const hasGenreMatch = (show.genres ?? []).some((genre) => preferredGenres.has(genre));
  return (hasGenreMatch ? GENRE_MATCH_WEIGHT : 0) + (show.rating?.average ?? 0);
}

function mapDiscoveryShow(
  show: TvmazeShow,
  preferredGenres: Set<string>,
  locale: Locale,
): NextBingeRecommendation {
  const matchedGenre = (show.genres ?? []).find((genre) => preferredGenres.has(genre));
  return {
    seriesId: show.id,
    name: show.name,
    localizedName: null,
    imageUrl: show.image?.medium ?? show.image?.original ?? null,
    rating: show.rating?.average ?? null,
    genres: show.genres ?? [],
    summary: stripHtml(show.summary),
    sourceTier: matchedGenre ? 'genre_discovery' : 'top_rated',
    reason: matchedGenre ? formatGenreDiscoveryReason(locale, matchedGenre) : formatTopRatedReason(locale),
    inWatchlist: false,
    nextEpisode: null,
    tvmazeUrl: show.url,
  };
}

export function rankDiscoveryShows(input: DiscoveryInput): NextBingeRecommendation[] {
  const { catalog, trackedIds, excludeSet, preferredGenres, locale } = input;
  const eligible = catalog.filter(
    (show) => !trackedIds.has(show.id) && !excludeSet.has(show.id) && (show.rating?.average ?? 0) > 0,
  );
  return [...eligible]
    .sort((a, b) => scoreShow(b, preferredGenres) - scoreShow(a, preferredGenres))
    .slice(0, MAX_DISCOVERY_PICKS)
    .map((show) => mapDiscoveryShow(show, preferredGenres, locale));
}
