import type { ListBadgeSummary } from '../types/list';
import type { SeriesProfile } from '../types/series';
import type { TvmazeCrewMember, TvmazeShow } from '../types/tvmaze';
import type { WatchStatus } from '../types/watchlist';
import { stripHtml } from './htmlSanitizer';
import { buildTrackingState, groupSeasons, mapCast, mapCrew } from './seriesMapper';

export type SeriesProfileInput = {
  show: TvmazeShow;
  crew: TvmazeCrewMember[] | null;
  localizedName: string | null;
  savedStatus: WatchStatus | null;
  watchedIds: Set<number>;
  lists: ListBadgeSummary[];
  partialData: boolean;
};

export function buildSeriesProfile(input: SeriesProfileInput): SeriesProfile {
  const { show } = input;
  const episodes = show._embedded?.episodes ?? [];
  return {
    id: show.id,
    name: show.name,
    localizedName: input.localizedName,
    showType: show.type ?? null,
    status: show.status ?? null,
    premiered: show.premiered ?? null,
    ended: show.ended ?? null,
    genres: show.genres ?? [],
    rating: show.rating?.average ?? null,
    networkName: show.network?.name ?? show.webChannel?.name ?? null,
    imageUrl: show.image?.original ?? show.image?.medium ?? null,
    summary: stripHtml(show.summary),
    tvmazeUrl: show.url,
    cast: mapCast(show._embedded?.cast ?? []),
    crew: input.crew ? mapCrew(input.crew) : null,
    seasons: groupSeasons(episodes, input.watchedIds),
    tracking: buildTrackingState(episodes, input.watchedIds, input.savedStatus),
    lists: input.lists,
    partialData: input.partialData,
  };
}
