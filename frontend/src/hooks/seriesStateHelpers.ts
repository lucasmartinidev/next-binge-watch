import type { SeasonGroup, SeriesProfile } from '@/types/series';
import type { SeriesTrackingState } from '@/types/watchlist';

export type EpisodeChange = {
  episodeId: number;
  watched: boolean;
  tracking: SeriesTrackingState;
};

export type SeasonChange = {
  seasonNumber: number;
  watched: boolean;
  tracking: SeriesTrackingState;
};

function recomputeSeason(season: SeasonGroup, episodes: SeasonGroup['episodes']): SeasonGroup {
  const watchedCount = episodes.filter((ep) => ep.watched).length;
  return {
    ...season,
    watchedCount,
    allWatched: episodes.length > 0 && watchedCount === episodes.length,
    episodes,
  };
}

export function withUpdatedEpisode(profile: SeriesProfile, change: EpisodeChange): SeriesProfile {
  const seasons = profile.seasons.map((season) =>
    recomputeSeason(
      season,
      season.episodes.map((ep) => (ep.id === change.episodeId ? { ...ep, watched: change.watched } : ep)),
    ),
  );
  return { ...profile, seasons, tracking: change.tracking };
}

export function withUpdatedSeason(profile: SeriesProfile, change: SeasonChange): SeriesProfile {
  const seasons = profile.seasons.map((season) => {
    if (season.seasonNumber !== change.seasonNumber) {
      return season;
    }
    return recomputeSeason(season, season.episodes.map((ep) => ({ ...ep, watched: change.watched })));
  });
  return { ...profile, seasons, tracking: change.tracking };
}

export function withResetTracking(profile: SeriesProfile): SeriesProfile {
  const seasons = profile.seasons.map((season) =>
    recomputeSeason(season, season.episodes.map((ep) => ({ ...ep, watched: false }))),
  );
  return {
    ...profile,
    seasons,
    lists: [],
    tracking: {
      inWatchlist: false,
      status: null,
      watchedEpisodes: 0,
      totalEpisodes: profile.tracking.totalEpisodes,
      progressPercent: 0,
      nextEpisode: null,
    },
  };
}
