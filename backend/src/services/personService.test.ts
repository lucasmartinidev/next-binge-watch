import { describe, expect, it, vi } from 'vitest';
import type { TvmazeClient } from '../data/tvmazeClient';
import { createInMemoryListRepositories } from './inMemoryListRepositories';
import { ListMembershipService } from './listMembershipService';
import { PersonService } from './personService';

const USER_A = '11111111-1111-1111-1111-111111111111';

describe('PersonService (UT-05)', () => {
  const samplePerson = {
    id: 14229, url: 'https://www.tvmaze.com/people/14229/bryan-cranston', name: 'Bryan Cranston',
    country: { name: 'United States' }, birthday: '1956-03-07', deathday: null, gender: 'Male',
    image: { original: 'https://img.example/bc.jpg' },
  };

  it('separates cast and crew credits and degrades gracefully if crewcredits fail', async () => {
    const tvmaze = {
      getPerson: vi.fn().mockResolvedValue(samplePerson),
      getPersonCastCredits: vi.fn().mockResolvedValue([
        { _embedded: { show: { id: 169, name: 'Breaking Bad', premiered: '2008-01-20', url: 'https://tvmaze.com/s/169' }, character: { id: 1, name: 'Walter White' } } },
      ]),
      getPersonCrewCredits: vi.fn().mockRejectedValue(new Error('crew timeout')),
    } as unknown as TvmazeClient;
    const service = new PersonService(tvmaze);
    const profile = await service.getPersonProfile(14229);
    expect(profile.castCredits).toHaveLength(1);
    expect(profile.crewCredits).toBeNull();
    expect(profile.partialData).toBe(true);
  });

  it('throws NOT_FOUND when person does not exist', async () => {
    const tvmaze = { getPerson: vi.fn().mockResolvedValue(null) } as unknown as TvmazeClient;
    const service = new PersonService(tvmaze);
    await expect(service.getPersonProfile(999999)).rejects.toMatchObject({ code: 'NOT_FOUND', statusCode: 404 });
  });

  it('hydrates person lists and credit series badges only when userId is provided (UT-04)', async () => {
    const tvmaze = {
      getPerson: vi.fn().mockResolvedValue(samplePerson),
      getPersonCastCredits: vi.fn().mockResolvedValue([
        { _embedded: { show: { id: 169, name: 'Breaking Bad', url: 'https://tvmaze.com/s/169' }, character: { id: 1, name: 'Walter' } } },
      ]),
      getPersonCrewCredits: vi.fn().mockResolvedValue([]),
    } as unknown as TvmazeClient;
    const watchlistRepo = {
      listAll: vi.fn().mockResolvedValue([]),
      findBySeriesId: vi.fn().mockResolvedValue({ seriesId: 169, status: 'watched' }),
    } as never;
    const { userListRepo, membershipRepo } = createInMemoryListRepositories(watchlistRepo);
    const membershipService = new ListMembershipService({
      userListRepo, membershipRepo, watchlistRepo,
      watchedEpisodeRepo: { listBySeriesId: vi.fn().mockResolvedValue([]) } as never, tvmaze,
    });
    const service = new PersonService(tvmaze, membershipService);
    const anonProfile = await service.getPersonProfile(14229, 'pt-BR');
    expect(anonProfile.castCredits?.[0].lists).toEqual([]);
    const authProfile = await service.getPersonProfile(14229, 'pt-BR', USER_A);
    expect(authProfile.lists).toEqual([]);
    expect(authProfile.castCredits?.[0].lists[0]).toMatchObject({ systemKey: 'watched', name: 'Assistida' });
  });
});
