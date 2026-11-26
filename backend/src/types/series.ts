import type { SeriesTrackingState } from './watchlist';

export type CastMember = {
  personId: number;
  name: string;
  imageUrl: string | null;
  characterName: string;
};

export type CrewMember = {
  personId: number;
  name: string;
  imageUrl: string | null;
  role: string;
};

export type EpisodeItem = {
  id: number;
  season: number;
  number: number;
  name: string;
  airdate: string | null;
  summary: string | null;
  watched: boolean;
};

export type SeasonGroup = {
  seasonNumber: number;
  watchedCount: number;
  totalCount: number;
  allWatched: boolean;
  episodes: EpisodeItem[];
};

export type SeriesProfile = {
  id: number;
  name: string;
  localizedName: string | null;
  showType: string | null;
  status: string | null;
  premiered: string | null;
  ended: string | null;
  genres: string[];
  rating: number | null;
  networkName: string | null;
  imageUrl: string | null;
  summary: string | null;
  tvmazeUrl: string;
  cast: CastMember[];
  crew: CrewMember[] | null;
  seasons: SeasonGroup[];
  tracking: SeriesTrackingState;
  partialData: boolean;
};
