import type { StoredWatchlistRow } from '../data/watchlistRepository';
import { formatContinueWatchingReason, formatWantToWatchReason } from '../i18n/recommendationMessages';
import type { Locale } from '../types/locale';
import type { NextBingeRecommendation } from '../types/recommendation';
import type { EpisodePointer } from '../types/watchlist';

type SavedRowFields = Omit<NextBingeRecommendation, 'summary' | 'sourceTier' | 'reason' | 'nextEpisode'>;

export type WatchingPickInput = {
  row: StoredWatchlistRow;
  summary: string | null;
  nextEpisode: EpisodePointer;
  locale: Locale;
};

function mapSavedRow(row: StoredWatchlistRow, locale: Locale): SavedRowFields {
  return {
    seriesId: row.seriesId,
    name: row.name,
    localizedName: locale === 'pt-BR' ? row.localizedNamePtBr : null,
    imageUrl: row.imageUrl,
    rating: row.rating,
    genres: row.genres,
    inWatchlist: true,
    tvmazeUrl: row.tvmazeUrl,
  };
}

export function toWatchingPick(input: WatchingPickInput): NextBingeRecommendation {
  return {
    ...mapSavedRow(input.row, input.locale),
    summary: input.summary,
    sourceTier: 'continue_watching',
    reason: formatContinueWatchingReason(input.locale, input.nextEpisode),
    nextEpisode: input.nextEpisode,
  };
}

export function buildWantToWatchPicks(
  saved: StoredWatchlistRow[],
  excludeSet: Set<number>,
  locale: Locale,
): NextBingeRecommendation[] {
  return saved
    .filter((row) => row.status === 'want_to_watch' && !excludeSet.has(row.seriesId))
    .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
    .map((row) => ({
      ...mapSavedRow(row, locale),
      summary: null,
      sourceTier: 'want_to_watch' as const,
      reason: formatWantToWatchReason(locale),
      nextEpisode: null,
    }));
}
