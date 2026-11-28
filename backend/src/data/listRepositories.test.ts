import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { closeDatabase, type DatabaseClient } from './database';
import { ListMembershipRepository } from './listMembershipRepository';
import { openTestDatabase } from './testDatabase';
import { UserListRepository } from './userListRepository';
import { WatchedEpisodeRepository } from './watchedEpisodeRepository';
import { WatchlistRepository } from './watchlistRepository';

describe('PostgreSQL UserList & ListMembership repositories (IT-02)', () => {
  let db: DatabaseClient;

  beforeEach(async () => {
    db = await openTestDatabase();
  });

  afterEach(async () => {
    await closeDatabase(db);
  });

  it('enforces uniqueness, update, transaction rollback, safe custom delete, and primary cascade', async () => {
    const userListRepo = new UserListRepository(db);
    const membershipRepo = new ListMembershipRepository(db);
    const watchlistRepo = new WatchlistRepository(db);
    const episodeRepo = new WatchedEpisodeRepository(db);

    const listA = await userListRepo.create({
      id: 'list-a', entityType: 'series', name: 'Sci-Fi Vault', description: null, icon: 'rocket', color: 'cyan', tags: ['sci-fi'],
    });
    const listB = await userListRepo.create({
      id: 'list-b', entityType: 'series', name: 'Top Rated', description: null, icon: 'star', color: 'amber', tags: [],
    });
    const updated = await userListRepo.update('list-a', { name: 'Sci-Fi Gold', tags: ['space'] });
    expect(updated?.name).toBe('Sci-Fi Gold');
    expect(await userListRepo.update('missing', { name: 'Nope' })).toBeNull();
    expect((await userListRepo.findByLowerName('sci-fi gold'))?.id).toBe('list-a');
    await expect(
      userListRepo.create({ id: 'dup', entityType: 'series', name: 'sci-fi gold', description: null, icon: 'tv', color: 'pink', tags: [] }),
    ).rejects.toThrow();

    await watchlistRepo.upsert({
      seriesId: 169, name: 'Breaking Bad', localizedNamePtBr: null, imageUrl: null,
      status: 'watching', genres: ['Drama'], rating: 9.2, totalEpisodes: 62, tvmazeUrl: 'https://tvmaze.com/s/169',
    });
    await episodeRepo.markEpisodes([{ seriesId: 169, episodeId: 101, seasonNumber: 1, episodeNumber: 1 }]);
    await membershipRepo.runTransaction((dbClient) =>
      membershipRepo.replaceSeriesCustomLists({ seriesId: 169, listIds: [listA.id, listB.id], dbClient }),
    );
    await expect(membershipRepo.runTransaction(() => Promise.reject(new Error('abort')))).rejects.toThrow('abort');

    expect((await membershipRepo.listSeriesByCustomListId('list-a')).map((s) => s.seriesId)).toEqual([169]);
    expect(await membershipRepo.removeSeriesFromCustomList('list-a', 169)).toBe(true);
    expect(await userListRepo.deleteCustomById('want_to_watch')).toBe(false);
    expect(await userListRepo.deleteCustomById('list-a')).toBe(true);
    expect((await episodeRepo.listBySeriesId(169)).length).toBe(1);
    expect((await membershipRepo.findSeriesMemberships([169])).get(169)?.customLists.map((l) => l.id)).toEqual(['list-b']);

    await watchlistRepo.deleteBySeriesId(169);
    expect((await membershipRepo.findSeriesMemberships([169])).get(169)).toBeUndefined();
  });

  it('persists and queries custom People list memberships in batch', async () => {
    const userListRepo = new UserListRepository(db);
    const membershipRepo = new ListMembershipRepository(db);
    await userListRepo.create({
      id: 'people-1', entityType: 'person', name: 'Actors', description: 'Great actors', icon: 'users', color: 'yellow', tags: ['cast'],
    });
    await membershipRepo.replacePersonCustomLists({
      person: { personId: 14229, name: 'Bryan Cranston', imageUrl: null, country: 'United States', tvmazeUrl: 'https://tvmaze.com/p/14229' },
      listIds: ['people-1'],
    });
    const map = await membershipRepo.findPersonMemberships([14229, 99999]);
    expect(map.get(14229)?.map((l) => l.name)).toEqual(['Actors']);
    expect(map.get(99999)).toBeUndefined();
    expect((await membershipRepo.listPeopleByCustomListId('people-1')).length).toBe(1);
    expect(await membershipRepo.removePersonFromCustomList('people-1', 14229)).toBe(true);
  });
});
