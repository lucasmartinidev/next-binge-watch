import { randomUUID } from 'node:crypto';
import type { ListMembershipRepository } from '../data/listMembershipRepository';
import type { TvmazeClient } from '../data/tvmazeClient';
import type { StoredUserList } from '../data/userListMapper';
import type { UserListRepository } from '../data/userListRepository';
import type { WatchedEpisodeRepository } from '../data/watchedEpisodeRepository';
import { AppError } from '../types/error';
import type { CreateListInput, ListDetailResponse, ListEntityType, UpdateListInput, UserListSummary, UserListsResponse } from '../types/list';
import type { Locale } from '../types/locale';
import { loadCustomPeopleItems, loadCustomSeriesItems } from './listDetailLoader';
import type { ListMembershipService } from './listMembershipService';
import { buildCustomListPatch, toUserListSummary } from './listResponseMapper';
import { validateListColor, validateListDescription, validateListEntityType, validateListIcon, validateListName, validateListTags } from './listValidation';
import type { WatchlistService } from './watchlistService';

export type UserListServiceDeps = {
  userListRepo: UserListRepository; membershipRepo: ListMembershipRepository; watchlistService: WatchlistService;
  watchedEpisodeRepo: WatchedEpisodeRepository; tvmaze: TvmazeClient; membershipService: ListMembershipService;
};

export type UpdateListCommand = { listId: string; patch: UpdateListInput & { entityType?: unknown }; locale: Locale };

export class UserListService {
  constructor(private readonly deps: UserListServiceDeps) {}

  async listAll(input: { type?: ListEntityType; tag?: string; locale: Locale }): Promise<UserListsResponse> {
    const all = await this.deps.userListRepo.listAllWithCounts();
    const primaryLists = all.filter((l) => l.isSystem).map((l) => toUserListSummary(l, input.locale));
    const allCustom = all.filter((l) => !l.isSystem);
    const availableTags = [...new Set(allCustom.flatMap((l) => l.tags))].sort((a, b) => a.localeCompare(b));
    const normalizedTag = input.tag?.trim().toLowerCase();
    const customLists = allCustom
      .filter((l) => !input.type || l.entityType === input.type)
      .filter((l) => !normalizedTag || l.tags.some((t) => t.toLowerCase() === normalizedTag))
      .map((l) => toUserListSummary(l, input.locale));
    return { primaryLists, customLists, availableTags };
  }

  async getDetail(input: { listId: string; locale: Locale }): Promise<ListDetailResponse> {
    const stored = await this.requireList(input.listId);
    const summary = toUserListSummary(stored, input.locale);
    if (stored.isSystem && stored.systemKey) {
      const watchlist = await this.deps.watchlistService.list({ status: stored.systemKey, locale: input.locale });
      return { list: { ...summary, entityType: 'series' }, items: watchlist.items };
    }
    if (stored.entityType === 'series') {
      return { list: { ...summary, entityType: 'series' }, items: await loadCustomSeriesItems(this.deps, stored.id, input.locale) };
    }
    return { list: { ...summary, entityType: 'person' }, items: await loadCustomPeopleItems(this.deps, stored.id) };
  }

  async createCustomList(input: CreateListInput & { locale: Locale }): Promise<UserListSummary> {
    const name = validateListName(input.name);
    if (await this.deps.userListRepo.findByLowerName(name.toLowerCase())) throw new AppError('CONFLICT', 'lists.nameTaken');
    const created = await this.deps.userListRepo.create({
      id: randomUUID(), entityType: validateListEntityType(input.entityType), name,
      description: validateListDescription(input.description), icon: validateListIcon(input.icon), color: validateListColor(input.color), tags: validateListTags(input.tags),
    });
    return toUserListSummary(created, input.locale);
  }

  async updateList(input: UpdateListCommand): Promise<UserListSummary> {
    const existing = await this.requireList(input.listId);
    if (input.patch.entityType !== undefined && input.patch.entityType !== existing.entityType) throw new AppError('FORBIDDEN', 'lists.entityTypeImmutable');
    if (existing.isSystem) return this.updatePrimaryList(existing, input);
    const patch = buildCustomListPatch(input.patch);
    if (patch.name && (await this.deps.userListRepo.findByLowerName(patch.name.toLowerCase(), existing.id))) throw new AppError('CONFLICT', 'lists.nameTaken');
    return toUserListSummary((await this.deps.userListRepo.update(existing.id, patch)) ?? existing, input.locale);
  }

  async deleteCustomList(listId: string): Promise<void> {
    if ((await this.requireList(listId)).isSystem) throw new AppError('FORBIDDEN', 'lists.primaryProtected');
    await this.deps.userListRepo.deleteCustomById(listId);
  }

  async removeItemFromCustomList(input: { listId: string; itemId: number }): Promise<void> {
    const existing = await this.requireList(input.listId);
    if (existing.isSystem) throw new AppError('FORBIDDEN', 'lists.primaryProtected');
    const removed = existing.entityType === 'series'
      ? await this.deps.membershipRepo.removeSeriesFromCustomList(existing.id, input.itemId)
      : await this.deps.membershipRepo.removePersonFromCustomList(existing.id, input.itemId);
    if (!removed) throw new AppError('NOT_FOUND', 'lists.itemNotFound');
  }

  private async updatePrimaryList(existing: StoredUserList, input: UpdateListCommand): Promise<UserListSummary> {
    if (input.patch.name !== undefined || input.patch.description !== undefined || input.patch.tags !== undefined) throw new AppError('FORBIDDEN', 'lists.primaryProtected');
    const icon = input.patch.icon !== undefined ? validateListIcon(input.patch.icon) : undefined;
    const color = input.patch.color !== undefined ? validateListColor(input.patch.color) : undefined;
    return toUserListSummary((await this.deps.userListRepo.update(existing.id, { icon, color })) ?? existing, input.locale);
  }

  private async requireList(listId: string): Promise<StoredUserList> {
    const found = await this.deps.userListRepo.findById(listId);
    if (!found) throw new AppError('NOT_FOUND', 'lists.notFound');
    return found;
  }
}
