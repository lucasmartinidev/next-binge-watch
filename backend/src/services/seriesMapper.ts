import type {
  CastMember,
  CrewMember,
  EpisodeItem,
  SeasonGroup,
} from '../types/series';
import type { TvmazeCastMember, TvmazeCrewMember, TvmazeEpisode } from '../types/tvmaze';
import type { EpisodePointer, SeriesTrackingState, WatchStatus } from '../types/watchlist';
import { stripHtml } from './htmlSanitizer';

export function mapCast(cast: TvmazeCastMember[]): CastMember[] {
  return cast.map((member) => ({
    personId: member.person.id,
    name: member.person.name,
    imageUrl: member.person.image?.medium ?? member.person.image?.original ?? null,
    characterName: member.character.name,
  }));
}

export function mapCrew(crew: TvmazeCrewMember[]): CrewMember[] {
  return crew.map((member) => ({
    personId: member.person.id,
    name: member.person.name,
    imageUrl: member.person.image?.medium ?? member.person.image?.original ?? null,
    role: member.type,
  }));
}

export function groupSeasons(episodes: TvmazeEpisode[], watchedIds: Set<number>): SeasonGroup[] {
  const sorted = [...episodes].sort((a, b) => a.season - b.season || (a.number ?? 0) - (b.number ?? 0));
  const grouped = new Map<number, EpisodeItem[]>();
  for (const episode of sorted) {
    const list = grouped.get(episode.season) ?? [];
    list.push({
      id: episode.id,
      season: episode.season,
      number: episode.number ?? 0,
      name: episode.name,
      airdate: episode.airdate ?? null,
      summary: stripHtml(episode.summary),
      watched: watchedIds.has(episode.id),
    });
    grouped.set(episode.season, list);
  }
  return Array.from(grouped.entries()).map(([seasonNumber, seasonEpisodes]) => {
    const watchedCount = seasonEpisodes.filter((ep) => ep.watched).length;
    return {
      seasonNumber,
      watchedCount,
      totalCount: seasonEpisodes.length,
      allWatched: seasonEpisodes.length > 0 && watchedCount === seasonEpisodes.length,
      episodes: seasonEpisodes,
    };
  });
}

export function buildTrackingState(
  episodes: TvmazeEpisode[],
  watchedIds: Set<number>,
  watchlistStatus: WatchStatus | null,
): SeriesTrackingState {
  const sorted = [...episodes].sort((a, b) => a.season - b.season || (a.number ?? 0) - (b.number ?? 0));
  const watchedEpisodes = sorted.filter((ep) => watchedIds.has(ep.id)).length;
  const totalEpisodes = sorted.length;
  const progressPercent = totalEpisodes > 0 ? Math.round((watchedEpisodes / totalEpisodes) * 100) : 0;
  const nextRaw = sorted.find((ep) => !watchedIds.has(ep.id));
  const nextEpisode: EpisodePointer | null = nextRaw
    ? {
        id: nextRaw.id,
        season: nextRaw.season,
        number: nextRaw.number ?? 0,
        name: nextRaw.name,
        airdate: nextRaw.airdate ?? null,
      }
    : null;
  return {
    inWatchlist: watchlistStatus !== null,
    status: watchlistStatus,
    watchedEpisodes,
    totalEpisodes,
    progressPercent,
    nextEpisode,
  };
}
