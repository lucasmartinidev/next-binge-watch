export type WatchStatus = 'want_to_watch' | 'watching' | 'watched';

export type WatchlistFilter = WatchStatus | 'all';

export type EpisodePointer = {
  id: number;
  season: number;
  number: number;
  name: string;
  airdate: string | null;
};

export type SeriesTrackingState = {
  inWatchlist: boolean;
  status: WatchStatus | null;
  watchedEpisodes: number;
  totalEpisodes: number;
  progressPercent: number;
  nextEpisode: EpisodePointer | null;
};

export type WatchlistItem = {
  seriesId: number;
  name: string;
  localizedName: string | null;
  imageUrl: string | null;
  status: WatchStatus;
  genres: string[];
  rating: number | null;
  watchedEpisodes: number;
  totalEpisodes: number;
  progressPercent: number;
  nextEpisode: EpisodePointer | null;
  tvmazeUrl: string;
  updatedAt: string;
};

export type WatchlistResponse = {
  total: number;
  items: WatchlistItem[];
};
