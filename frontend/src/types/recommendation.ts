import type { ListBadgeSummary } from './list';
import type { Locale } from './locale';
import type { EpisodePointer } from './watchlist';

export type RecommendationSourceTier =
  | 'continue_watching'
  | 'want_to_watch'
  | 'genre_discovery'
  | 'top_rated';

export type NextBingeRecommendation = {
  seriesId: number;
  name: string;
  localizedName: string | null;
  imageUrl: string | null;
  rating: number | null;
  genres: string[];
  summary: string | null;
  sourceTier: RecommendationSourceTier;
  reason: string;
  inWatchlist: boolean;
  lists?: ListBadgeSummary[];
  nextEpisode: EpisodePointer | null;
  tvmazeUrl: string;
};

export type NextBingeResponse = {
  locale: Locale;
  recommendation: NextBingeRecommendation | null;
  hasMore: boolean;
};
