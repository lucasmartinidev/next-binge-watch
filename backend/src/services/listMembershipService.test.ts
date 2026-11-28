import { describe, expect, it, vi } from 'vitest';
import type { TvmazeClient } from '../data/tvmazeClient';
import { createInMemoryListRepositories } from './inMemoryListRepositories';
import { createInMemoryRepositories } from './inMemoryRepositories';
import { ListMembershipService } from './listMembershipService';
import { UserListService } from './userListService';
import { WatchlistService } from './watchlistService';

describe('ListMembershipService (UT-03)', () => {
  function setup() {
    const tvmaze = {
      getShowWithEmbeds: vi.fn().mockResolvedValue({
        id: 169, name: 'Breaking Bad', url: 'https://tvmaze.com/shows/169', genres: ['Drama'],
        rating: { average: 9.2 }, _embedded: { episodes: [{ id: 1, name: 'Pilot', season: 1, number: 1 }] },
      }),
      getShowAkas: vi.fn().mockResolvedValue([]),
      getPerson: vi.fn().mockResolvedValue({
        id: 14229, name: 'Bryan Cranston', url: 'https://tvmaze.com/people/14229', country: { name: 'United States' },
      }),
    } as unknown as TvmazeClient;
    const { watchlistRepo, episodeRepo } = createInMemoryRepositories();
    const { userListRepo, membershipRepo } = createInMemoryListRepositories(watchlistRepo);
    const membershipService = new ListMembershipService({ userListRepo, membershipRepo, watchlistRepo, watchedEpisodeRepo: episodeRepo, tvmaze });
    const watchlistService = new WatchlistService(tvmaze, watchlistRepo, episodeRepo);
    const userListService = new UserListService({ userListRepo, membershipRepo, watchlistService, watchedEpisodeRepo: episodeRepo, tvmaze, membershipService });
    return { membershipService, userListService };
  }

  it('enforces FR10 invariant, orders primary badge first, clears on untrack, and rejects cross-type', async () => {
    const { membershipService, userListService } = setup();
    const seriesListA = await userListService.createCustomList({ entityType: 'series', name: 'Favorites', icon: 'star', color: 'violet', locale: 'en' });
    const seriesListB = await userListService.createCustomList({ entityType: 'series', name: 'Weekend', icon: 'flame', color: 'orange', locale: 'en' });
    const peopleList = await userListService.createCustomList({ entityType: 'person', name: 'Directors', icon: 'users', color: 'yellow', locale: 'en' });

    await expect(
      membershipService.updateSeriesLists({ seriesId: 169, primaryStatus: 'want_to_watch', customListIds: [peopleList.id], locale: 'en' }),
    ).rejects.toMatchObject({ statusCode: 400 });

    const first = await membershipService.updateSeriesLists({
      seriesId: 169, primaryStatus: null, customListIds: [seriesListA.id, seriesListB.id], locale: 'en',
    });
    expect(first.tracking.status).toBe('want_to_watch');
    expect(first.lists.map((b) => b.id)).toEqual(['want_to_watch', seriesListA.id, seriesListB.id]);

    const cleared = await membershipService.updateSeriesLists({
      seriesId: 169, primaryStatus: null, customListIds: [], locale: 'en',
    });
    expect(cleared.tracking.inWatchlist).toBe(false);
    expect(cleared.lists).toEqual([]);

    const personUpdated = await membershipService.updatePersonLists({ personId: 14229, customListIds: [peopleList.id] });
    expect(personUpdated.lists.map((b) => b.name)).toEqual(['Directors']);
  });
});
