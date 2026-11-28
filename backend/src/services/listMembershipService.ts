import type { ListMembershipRepository } from '../data/listMembershipRepository';
import type { TvmazeClient } from '../data/tvmazeClient';
import type { UserListRepository } from '../data/userListRepository';
import type { WatchedEpisodeRepository } from '../data/watchedEpisodeRepository';
import type { WatchlistRepository } from '../data/watchlistRepository';
import { AppError } from '../types/error';
import type { ListBadgeSummary, ListEntityType } from '../types/list';
import type { Locale } from '../types/locale';
import type { SeriesTrackingState, WatchStatus } from '../types/watchlist';
import { toListBadge } from './listResponseMapper';
import { commitSeriesLists } from './listSeriesCommit';

export type ListMembershipServiceDeps = {
  userListRepo: UserListRepository;
  membershipRepo: ListMembershipRepository;
  watchlistRepo: WatchlistRepository;
  watchedEpisodeRepo: WatchedEpisodeRepository;
  tvmaze: TvmazeClient;
};

export type UpdateSeriesListsCommand = {
  userId: string; seriesId: number; primaryStatus: WatchStatus | null; customListIds: string[]; locale: Locale;
};
export type UpdateSeriesListsResponse = { seriesId: number; tracking: SeriesTrackingState; lists: ListBadgeSummary[] };
export type UpdatePersonListsCommand = { userId: string; personId: number; customListIds: string[] };

export class ListMembershipService {
  constructor(private readonly deps: ListMembershipServiceDeps) {}

  async getSeriesBadgesMap(userId: string, seriesIds: number[], locale: Locale): Promise<Map<number, ListBadgeSummary[]>> {
    const result = new Map<number, ListBadgeSummary[]>();
    if (seriesIds.length === 0) return result;
    const [allLists, memberships] = await Promise.all([
      this.deps.userListRepo.listAllWithCounts(userId),
      this.deps.membershipRepo.findSeriesMemberships(userId, seriesIds),
    ]);
    const systemByKey = new Map(allLists.filter((l) => l.isSystem && l.systemKey).map((l) => [l.systemKey!, l]));
    for (const seriesId of seriesIds) {
      const entry = memberships.get(seriesId);
      const primary = entry?.primaryStatus ? systemByKey.get(entry.primaryStatus) : undefined;
      const ordered = [...(primary ? [primary] : []), ...(entry?.customLists ?? [])];
      result.set(seriesId, ordered.map((list) => toListBadge(list, locale)));
    }
    return result;
  }

  async getPersonBadgesMap(userId: string, personIds: number[]): Promise<Map<number, ListBadgeSummary[]>> {
    const result = new Map<number, ListBadgeSummary[]>();
    if (personIds.length === 0) return result;
    const memberships = await this.deps.membershipRepo.findPersonMemberships(userId, personIds);
    for (const personId of personIds) {
      result.set(personId, (memberships.get(personId) ?? []).map((list) => toListBadge(list, 'en')));
    }
    return result;
  }

  async updateSeriesLists(input: UpdateSeriesListsCommand): Promise<UpdateSeriesListsResponse> {
    await this.validateTargetLists(input.userId, input.customListIds, 'series');
    const [existingRow, watchedRows] = await Promise.all([
      this.deps.watchlistRepo.findBySeriesId(input.userId, input.seriesId),
      this.deps.watchedEpisodeRepo.listBySeriesId(input.userId, input.seriesId),
    ]);
    const targetStatus = this.resolveTargetStatus(input, existingRow?.status ?? null, watchedRows.length);
    const tracking = await commitSeriesLists(this.deps, { ...input, existingRow, targetStatus });
    const badgesMap = await this.getSeriesBadgesMap(input.userId, [input.seriesId], input.locale);
    return { seriesId: input.seriesId, tracking, lists: badgesMap.get(input.seriesId) ?? [] };
  }

  async updatePersonLists(input: UpdatePersonListsCommand): Promise<{ personId: number; lists: ListBadgeSummary[] }> {
    await this.validateTargetLists(input.userId, input.customListIds, 'person');
    const person = await this.deps.tvmaze.getPerson(input.personId);
    if (!person) throw new AppError('NOT_FOUND', 'person.notFound');
    const snapshot = {
      personId: person.id, name: person.name,
      imageUrl: person.image?.medium ?? person.image?.original ?? null,
      country: person.country?.name ?? null, tvmazeUrl: person.url,
    };
    await this.deps.membershipRepo.runTransaction((dbClient) =>
      this.deps.membershipRepo.replacePersonCustomLists({ userId: input.userId, person: snapshot, listIds: input.customListIds, dbClient }),
    );
    const badgesMap = await this.getPersonBadgesMap(input.userId, [input.personId]);
    return { personId: input.personId, lists: badgesMap.get(input.personId) ?? [] };
  }

  private async validateTargetLists(userId: string, listIds: string[], expectedType: ListEntityType): Promise<void> {
    for (const id of listIds) {
      const list = await this.deps.userListRepo.findById(userId, id);
      if (!list) throw new AppError('NOT_FOUND', 'lists.notFound');
      if (list.isSystem || list.entityType !== expectedType) throw new AppError('VALIDATION_ERROR', 'lists.crossTypeNotAllowed');
    }
  }

  private resolveTargetStatus(input: UpdateSeriesListsCommand, currentStatus: WatchStatus | null, watchedCount: number): WatchStatus | null {
    if (input.primaryStatus) return input.primaryStatus;
    if (input.customListIds.length === 0) return null;
    return currentStatus ?? (watchedCount > 0 ? 'watching' : 'want_to_watch');
  }
}
