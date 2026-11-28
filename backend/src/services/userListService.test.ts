import { describe, expect, it, vi } from 'vitest';
import type { TvmazeClient } from '../data/tvmazeClient';
import { createInMemoryListRepositories } from './inMemoryListRepositories';
import { createInMemoryRepositories } from './inMemoryRepositories';
import { ListMembershipService } from './listMembershipService';
import { UserListService } from './userListService';
import { WatchlistService } from './watchlistService';

describe('UserListService (UT-02)', () => {
  function setup() {
    const tvmaze = {
      getShowWithEmbeds: vi.fn().mockResolvedValue({
        id: 169, name: 'Breaking Bad', url: 'https://tvmaze.com/shows/169', genres: ['Drama'],
        rating: { average: 9.2 }, _embedded: { episodes: [{ id: 1, name: 'Pilot', season: 1, number: 1 }] },
      }),
      getShowAkas: vi.fn().mockResolvedValue([]),
      getPerson: vi.fn().mockResolvedValue({ id: 14229, name: 'Bryan Cranston', url: 'https://tvmaze.com/p/14229' }),
    } as unknown as TvmazeClient;
    const { watchlistRepo, episodeRepo } = createInMemoryRepositories();
    const { userListRepo, membershipRepo } = createInMemoryListRepositories(watchlistRepo);
    const membershipService = new ListMembershipService({ userListRepo, membershipRepo, watchlistRepo, watchedEpisodeRepo: episodeRepo, tvmaze });
    const watchlistService = new WatchlistService(tvmaze, watchlistRepo, episodeRepo);
    const userListService = new UserListService({ userListRepo, membershipRepo, watchlistService, watchedEpisodeRepo: episodeRepo, tvmaze, membershipService });
    return { userListService, membershipService };
  }

  it('protects primary lists from deletion or name/description/tags/type edits while allowing icon & color updates', async () => {
    const { userListService } = setup();
    const { primaryLists } = await userListService.listAll({ locale: 'pt-BR' });
    expect(primaryLists.map((l) => l.name)).toEqual(['Quero Assistir', 'Assistindo', 'Assistida']);
    await expect(userListService.deleteCustomList('want_to_watch')).rejects.toMatchObject({ statusCode: 403 });
    await expect(
      userListService.updateList({ listId: 'watching', patch: { name: 'Renamed' }, locale: 'en' }),
    ).rejects.toMatchObject({ statusCode: 403 });
    const updated = await userListService.updateList({ listId: 'watching', patch: { icon: 'flame', color: 'pink' }, locale: 'en' });
    expect(updated.icon).toBe('flame');
    expect(updated.color).toBe('pink');
  });

  it('supports custom list CRUD, detail loading for primary/series/people, item removal, and safe deletion', async () => {
    const { userListService, membershipService } = setup();
    const sciFi = await userListService.createCustomList({
      entityType: 'series', name: 'Weekend Sci-Fi', description: 'Space shows', icon: 'rocket', color: 'cyan', tags: ['sci-fi', 'weekend'], locale: 'en',
    });
    const people = await userListService.createCustomList({
      entityType: 'person', name: 'Creators', icon: 'users', color: 'yellow', locale: 'en',
    });
    await expect(userListService.createCustomList({ entityType: 'series', name: 'weekend sci-fi', icon: 'tv', color: 'violet', locale: 'en' }))
      .rejects.toMatchObject({ statusCode: 409 });
    await expect(userListService.updateList({ listId: sciFi.id, patch: { entityType: 'person' }, locale: 'en' }))
      .rejects.toMatchObject({ statusCode: 403 });
    const edited = await userListService.updateList({ listId: sciFi.id, patch: { name: 'Sci-Fi Gold', tags: ['top'] }, locale: 'en' });
    expect(edited.name).toBe('Sci-Fi Gold');

    await membershipService.updateSeriesLists({ seriesId: 169, primaryStatus: 'watching', customListIds: [sciFi.id], locale: 'en' });
    await membershipService.updatePersonLists({ personId: 14229, customListIds: [people.id] });

    const primaryDetail = await userListService.getDetail({ listId: 'watching', locale: 'en' });
    expect(primaryDetail.items).toHaveLength(1);
    const seriesDetail = await userListService.getDetail({ listId: sciFi.id, locale: 'en' });
    expect(seriesDetail.items).toHaveLength(1);
    const peopleDetail = await userListService.getDetail({ listId: people.id, locale: 'en' });
    expect(peopleDetail.items).toHaveLength(1);

    await userListService.removeItemFromCustomList({ listId: sciFi.id, itemId: 169 });
    await userListService.removeItemFromCustomList({ listId: people.id, itemId: 14229 });
    await expect(userListService.removeItemFromCustomList({ listId: people.id, itemId: 14229 })).rejects.toMatchObject({ statusCode: 404 });

    const filtered = await userListService.listAll({ type: 'series', tag: 'TOP', locale: 'en' });
    expect(filtered.customLists).toHaveLength(1);
    await userListService.deleteCustomList(sciFi.id);
    await expect(userListService.getDetail({ listId: 'missing', locale: 'en' })).rejects.toMatchObject({ statusCode: 404 });
  });
});
