import type { ListMembershipRepository } from '../data/listMembershipRepository';
import type { TvmazeClient } from '../data/tvmazeClient';
import type { WatchedEpisodeRepository } from '../data/watchedEpisodeRepository';
import type { PersonListItem } from '../types/list';
import type { Locale } from '../types/locale';
import type { WatchlistItem } from '../types/watchlist';
import type { ListMembershipService } from './listMembershipService';
import { findNextEpisode, mapWatchlistItem } from './watchlistMapper';

type DetailDeps = {
  membershipRepo: ListMembershipRepository;
  watchedEpisodeRepo: WatchedEpisodeRepository;
  tvmaze: TvmazeClient;
  membershipService: ListMembershipService;
};

export async function loadCustomSeriesItems(
  deps: DetailDeps,
  input: { userId: string; listId: string; locale: Locale },
): Promise<WatchlistItem[]> {
  const [rows, counts] = await Promise.all([
    deps.membershipRepo.listSeriesByCustomListId(input.userId, input.listId),
    deps.watchedEpisodeRepo.listAllCounts(input.userId),
  ]);
  const badgesMap = await deps.membershipService.getSeriesBadgesMap(input.userId, rows.map((r) => r.seriesId), input.locale);
  return Promise.all(
    rows.map(async (row) => {
      const watchedEpisodes = counts.get(row.seriesId) ?? 0;
      const show = row.status === 'watching' ? await deps.tvmaze.getShowWithEmbeds(row.seriesId).catch(() => null) : null;
      const watchedRows = show ? await deps.watchedEpisodeRepo.listBySeriesId(input.userId, row.seriesId) : [];
      const nextEpisode = show
        ? findNextEpisode(show._embedded?.episodes ?? [], new Set(watchedRows.map((w) => w.episodeId)))
        : null;
      return mapWatchlistItem({ row, watchedEpisodes, locale: input.locale, nextEpisode, lists: badgesMap.get(row.seriesId) });
    }),
  );
}

export async function loadCustomPeopleItems(
  deps: Pick<DetailDeps, 'membershipRepo' | 'membershipService'>,
  input: { userId: string; listId: string },
): Promise<PersonListItem[]> {
  const rows = await deps.membershipRepo.listPeopleByCustomListId(input.userId, input.listId);
  const badgesMap = await deps.membershipService.getPersonBadgesMap(input.userId, rows.map((r) => r.personId));
  return rows.map((row) => ({
    personId: row.personId,
    name: row.name,
    imageUrl: row.imageUrl,
    country: row.country,
    tvmazeUrl: row.tvmazeUrl,
    addedAt: row.addedAt,
    lists: badgesMap.get(row.personId) ?? [],
  }));
}
