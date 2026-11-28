import type { ListMembershipRepository } from '../data/listMembershipRepository';
import type { TvmazeClient } from '../data/tvmazeClient';
import type { WatchedEpisodeRepository } from '../data/watchedEpisodeRepository';
import type { StoredWatchlistRow, WatchlistRepository } from '../data/watchlistRepository';
import { AppError } from '../types/error';
import type { Locale } from '../types/locale';
import type { TvmazeShow } from '../types/tvmaze';
import type { SeriesTrackingState, WatchStatus } from '../types/watchlist';
import { resolveLocalizedAka } from './akaResolver';
import { buildTrackingState } from './seriesMapper';
import { computeSyncedStatus } from './watchlistMapper';

export type CommitSeriesListsInput = {
  seriesId: number;
  customListIds: string[];
  locale: Locale;
  existingRow: StoredWatchlistRow | null;
  targetStatus: WatchStatus | null;
};

type CommitDeps = {
  membershipRepo: ListMembershipRepository;
  watchlistRepo: WatchlistRepository;
  watchedEpisodeRepo: WatchedEpisodeRepository;
  tvmaze: TvmazeClient;
};

function toUpsertPayload(input: { show: TvmazeShow; status: WatchStatus; localizedNamePtBr: string | null; totalEpisodes: number }) {
  return {
    seriesId: input.show.id,
    name: input.show.name,
    localizedNamePtBr: input.localizedNamePtBr,
    imageUrl: input.show.image?.medium ?? input.show.image?.original ?? null,
    status: input.status,
    genres: input.show.genres ?? [],
    rating: input.show.rating?.average ?? null,
    totalEpisodes: input.totalEpisodes,
    tvmazeUrl: input.show.url,
  };
}

export async function commitSeriesLists(
  deps: CommitDeps,
  input: CommitSeriesListsInput,
): Promise<SeriesTrackingState> {
  if (!input.targetStatus) {
    await deps.membershipRepo.runTransaction(async (dbClient) => {
      await deps.membershipRepo.replaceSeriesCustomLists({ seriesId: input.seriesId, listIds: [], dbClient });
      await deps.watchlistRepo.deleteBySeriesId(input.seriesId, dbClient);
    });
    return buildTrackingState([], new Set(), null);
  }
  const show = await deps.tvmaze.getShowWithEmbeds(input.seriesId);
  if (!show) throw new AppError('NOT_FOUND', 'series.notFound');
  const episodes = show._embedded?.episodes ?? [];
  const watchedRows = await deps.watchedEpisodeRepo.listBySeriesId(input.seriesId);
  const watchedIds = new Set(watchedRows.map((row) => row.episodeId));
  const syncedStatus = input.existingRow
    ? input.targetStatus
    : computeSyncedStatus(input.targetStatus, watchedIds.size, episodes.length);
  const localizedNamePtBr =
    input.existingRow?.localizedNamePtBr ??
    (input.locale === 'pt-BR'
      ? resolveLocalizedAka(await deps.tvmaze.getShowAkas(input.seriesId).catch(() => []), 'pt-BR')
      : null);
  await deps.membershipRepo.runTransaction(async (dbClient) => {
    await deps.watchlistRepo.upsert(toUpsertPayload({ show, status: syncedStatus, localizedNamePtBr, totalEpisodes: episodes.length }), dbClient);
    await deps.membershipRepo.replaceSeriesCustomLists({ seriesId: input.seriesId, listIds: input.customListIds, dbClient });
  });
  return buildTrackingState(episodes, watchedIds, syncedStatus);
}
