import { randomUUID } from 'node:crypto';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { closeDatabase, type DatabaseClient } from './database';
import { ensurePrimaryListsForUser } from './initialAdminSeed';
import { ListMembershipRepository } from './listMembershipRepository';
import { openTestDatabase, resetTestDatabase } from './testDatabase';
import { UserListRepository } from './userListRepository';
import { WatchedEpisodeRepository } from './watchedEpisodeRepository';
import { WatchlistRepository } from './watchlistRepository';

describe('PostgreSQL UserList & ListMembership repositories (IT-02, IT-06)', () => {
  let db: DatabaseClient;
  let adminId: string;

  beforeEach(async () => {
    db = await openTestDatabase();
    adminId = await resetTestDatabase(db);
  });

  afterEach(async () => {
    await closeDatabase(db);
  });

  it('enforces per-user uniqueness, update, transaction rollback, safe custom delete, and primary cascade', async () => {
    const userListRepo = new UserListRepository(db);
    const membershipRepo = new ListMembershipRepository(db);
    const watchlistRepo = new WatchlistRepository(db);
    const episodeRepo = new WatchedEpisodeRepository(db);

    const listA = await userListRepo.create({
      id: 'list-a', userId: adminId, entityType: 'series', name: 'Sci-Fi Vault', description: null, icon: 'rocket', color: 'cyan', tags: ['sci-fi'],
    });
    const listB = await userListRepo.create({
      id: 'list-b', userId: adminId, entityType: 'series', name: 'Top Rated', description: null, icon: 'star', color: 'amber', tags: [],
    });
    const updated = await userListRepo.update(adminId, 'list-a', { name: 'Sci-Fi Gold', tags: ['space'] });
    expect(updated?.name).toBe('Sci-Fi Gold');
    expect(await userListRepo.update(adminId, 'missing', { name: 'Nope' })).toBeNull();
    expect((await userListRepo.findByLowerName(adminId, 'sci-fi gold'))?.id).toBe('list-a');
    await expect(
      userListRepo.create({ id: 'dup', userId: adminId, entityType: 'series', name: 'sci-fi gold', description: null, icon: 'tv', color: 'pink', tags: [] }),
    ).rejects.toThrow();

    await watchlistRepo.upsert({
      userId: adminId, seriesId: 169, name: 'Breaking Bad', localizedNamePtBr: null, imageUrl: null,
      status: 'watching', genres: ['Drama'], rating: 9.2, totalEpisodes: 62, tvmazeUrl: 'https://tvmaze.com/s/169',
    });
    await episodeRepo.markEpisodes([{ userId: adminId, seriesId: 169, episodeId: 101, seasonNumber: 1, episodeNumber: 1 }]);
    await membershipRepo.runTransaction((dbClient) =>
      membershipRepo.replaceSeriesCustomLists({ userId: adminId, seriesId: 169, listIds: [listA.id, listB.id], dbClient }),
    );
    await expect(membershipRepo.runTransaction(() => Promise.reject(new Error('abort')))).rejects.toThrow('abort');

    expect((await membershipRepo.listSeriesByCustomListId(adminId, 'list-a')).map((s) => s.seriesId)).toEqual([169]);
    expect(await membershipRepo.removeSeriesFromCustomList(adminId, 'list-a', 169)).toBe(true);
    expect(await userListRepo.deleteCustomById(adminId, 'want_to_watch')).toBe(false);
    expect(await userListRepo.deleteCustomById(adminId, 'list-a')).toBe(true);
    expect((await episodeRepo.listBySeriesId(adminId, 169)).length).toBe(1);
    expect((await membershipRepo.findSeriesMemberships(adminId, [169])).get(169)?.customLists.map((l) => l.id)).toEqual(['list-b']);

    await watchlistRepo.deleteBySeriesId(adminId, 169);
    expect((await membershipRepo.findSeriesMemberships(adminId, [169])).get(169)).toBeUndefined();
  });

  it('isolates lists and memberships across distinct users (IT-06)', async () => {
    const userListRepo = new UserListRepository(db);
    const membershipRepo = new ListMembershipRepository(db);
    const otherUserId = randomUUID();
    await db.query(
      `INSERT INTO users (id, username, email, client_salt, password_hash, role) VALUES ($1, 'other-user', 'other@example.com', 's', 'h', 'USER')`,
      [otherUserId],
    );
    await ensurePrimaryListsForUser(db, otherUserId);
    await userListRepo.create({
      id: 'admin-actors', userId: adminId, entityType: 'person', name: 'Actors', description: 'Great actors', icon: 'users', color: 'yellow', tags: ['cast'],
    });
    const otherActors = await userListRepo.create({
      id: 'other-actors', userId: otherUserId, entityType: 'person', name: 'Actors', description: null, icon: 'users', color: 'cyan', tags: [],
    });
    expect(otherActors.name).toBe('Actors');
    await membershipRepo.replacePersonCustomLists({
      userId: adminId,
      person: { personId: 14229, name: 'Bryan Cranston', imageUrl: null, country: 'United States', tvmazeUrl: 'https://tvmaze.com/p/14229' },
      listIds: ['admin-actors'],
    });
    expect((await membershipRepo.findPersonMemberships(adminId, [14229])).get(14229)?.map((l) => l.name)).toEqual(['Actors']);
    expect((await membershipRepo.findPersonMemberships(otherUserId, [14229])).get(14229)).toBeUndefined();
    expect((await membershipRepo.listPeopleByCustomListId(adminId, 'admin-actors')).length).toBe(1);
    expect(await membershipRepo.removePersonFromCustomList(adminId, 'admin-actors', 14229)).toBe(true);
  });
});
