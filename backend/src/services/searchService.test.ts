import { describe, expect, it, vi } from 'vitest';
import type { TvmazeClient } from '../data/tvmazeClient';
import type { WatchlistRepository } from '../data/watchlistRepository';
import { createInMemoryListRepositories } from './inMemoryListRepositories';
import { ListMembershipService } from './listMembershipService';
import { SearchService } from './searchService';

const USER_A = '11111111-1111-1111-1111-111111111111';

describe('SearchService (UT-03)', () => {
  function makeDeps() {
    const tvmaze = {
      searchShows: vi.fn().mockResolvedValue([
        {
          score: 0.9,
          show: {
            id: 169, url: 'https://www.tvmaze.com/shows/169/breaking-bad', name: 'Breaking Bad',
            type: 'Scripted', genres: ['Drama'], status: 'Ended', premiered: '2008-01-20',
            rating: { average: 9.2 }, image: { medium: 'https://img.example/bb.jpg' },
          },
        },
      ]),
      searchPeople: vi.fn().mockResolvedValue([
        {
          score: 1.2,
          person: {
            id: 14229, url: 'https://www.tvmaze.com/people/14229/bryan-cranston',
            name: 'Bryan Cranston', country: { name: 'United States' }, image: { medium: 'https://img.example/bc.jpg' },
          },
        },
      ]),
    } as unknown as TvmazeClient;
    const watchlistRepo = {
      listAll: vi.fn().mockResolvedValue([{ seriesId: 169, localizedNamePtBr: 'Breaking Bad: A Química do Mal' }]),
    } as unknown as WatchlistRepository;
    return { tvmaze, watchlistRepo, service: new SearchService(tvmaze, watchlistRepo) };
  }

  it('merges and sorts show and person results for scope all with saved pt-BR AKA when authenticated', async () => {
    const { service } = makeDeps();
    const result = await service.search({ query: 'br', type: 'all', locale: 'pt-BR', userId: USER_A });
    expect(result.total).toBe(2);
    expect(result.items[0].contentType).toBe('person');
    expect(result.items[1]).toMatchObject({
      id: 169, contentType: 'series', localizedName: 'Breaking Bad: A Química do Mal', subtitle: 'Scripted · 2008',
    });
  });

  it('omits personal list badges and saved AKAs when unauthenticated', async () => {
    const { service, watchlistRepo } = makeDeps();
    const result = await service.search({ query: 'br', type: 'all', locale: 'pt-BR' });
    expect(result.total).toBe(2);
    expect(result.items[1].lists).toEqual([]);
    expect(watchlistRepo.listAll).not.toHaveBeenCalled();
  });

  it('hydrates primary and custom list badges onto search results (UT-04)', async () => {
    const { tvmaze } = makeDeps();
    const watchlistRepo = {
      listAll: vi.fn().mockResolvedValue([]),
      findBySeriesId: vi.fn().mockResolvedValue({ seriesId: 169, status: 'watching' }),
    } as unknown as WatchlistRepository;
    const { userListRepo, membershipRepo } = createInMemoryListRepositories(watchlistRepo);
    const membershipService = new ListMembershipService({
      userListRepo, membershipRepo, watchlistRepo,
      watchedEpisodeRepo: { listBySeriesId: vi.fn().mockResolvedValue([]) } as never, tvmaze,
    });
    const service = new SearchService(tvmaze, watchlistRepo, membershipService);
    const res = await service.search({ query: 'br', type: 'series', locale: 'pt-BR', userId: USER_A });
    expect(res.items[0].lists[0]).toMatchObject({ systemKey: 'watching', name: 'Assistindo', isSystem: true });
  });
});
