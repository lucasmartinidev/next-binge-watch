import { describe, expect, it, vi } from 'vitest';
import type { TvmazeClient } from '../data/tvmazeClient';
import { createInMemoryRepositories } from './inMemoryRepositories';
import { RecommendationService } from './recommendationService';

describe('RecommendationService (UT-05)', () => {
  const catalogShows = [
    {
      id: 10,
      url: 'https://tvmaze.com/s/10',
      name: 'Top Drama',
      genres: ['Drama'],
      rating: { average: 9.0 },
      summary: '<p>Great drama</p>',
    },
    {
      id: 20,
      url: 'https://tvmaze.com/s/20',
      name: 'Sci-Fi Gem',
      genres: ['Science-Fiction'],
      rating: { average: 8.1 },
      summary: '<p>Space opera</p>',
    },
  ];

  it('recommends top-rated discovery show when watchlist is empty and supports excludeIds', async () => {
    const tvmaze = {
      getShowsPage: vi.fn().mockResolvedValue(catalogShows),
      getShowWithEmbeds: vi.fn().mockResolvedValue(null),
    } as unknown as TvmazeClient;
    const { watchlistRepo, episodeRepo } = createInMemoryRepositories();
    const service = new RecommendationService(tvmaze, watchlistRepo, episodeRepo);
    const first = await service.getNextBinge({ locale: 'en', excludeIds: [] });
    expect(first.recommendation?.seriesId).toBe(10);
    expect(first.recommendation?.sourceTier).toBe('top_rated');
    expect(first.hasMore).toBe(true);

    const second = await service.getNextBinge({ locale: 'pt-BR', excludeIds: [10] });
    expect(second.recommendation?.seriesId).toBe(20);
    expect(second.recommendation?.reason).toBe('Série bem avaliada para começar a assistir');
    expect(second.hasMore).toBe(false);
  });

  it('prioritizes watching > want_to_watch > genre_discovery', async () => {
    const { watchlistRepo, episodeRepo } = createInMemoryRepositories();
    await watchlistRepo.upsert({
      seriesId: 169,
      name: 'Breaking Bad',
      localizedNamePtBr: 'Breaking Bad: A Química do Mal',
      imageUrl: null,
      status: 'watching',
      genres: ['Science-Fiction'],
      rating: 9.2,
      totalEpisodes: 2,
      tvmazeUrl: 'https://tvmaze.com/s/169',
    });
    await watchlistRepo.upsert({
      seriesId: 300,
      name: 'Queued Show',
      localizedNamePtBr: null,
      imageUrl: null,
      status: 'want_to_watch',
      genres: ['Comedy'],
      rating: 8.8,
      totalEpisodes: 10,
      tvmazeUrl: 'https://tvmaze.com/s/300',
    });
    const tvmaze = {
      getShowsPage: vi.fn().mockResolvedValue(catalogShows),
      getShowWithEmbeds: vi.fn().mockResolvedValue({
        id: 169,
        name: 'Breaking Bad',
        url: 'https://tvmaze.com/s/169',
        summary: '<p>BB</p>',
        _embedded: { episodes: [{ id: 1, name: 'Pilot', season: 1, number: 1 }] },
      }),
    } as unknown as TvmazeClient;
    const service = new RecommendationService(tvmaze, watchlistRepo, episodeRepo);

    const pick1 = await service.getNextBinge({ locale: 'pt-BR', excludeIds: [] });
    expect(pick1.recommendation?.seriesId).toBe(169);
    expect(pick1.recommendation?.sourceTier).toBe('continue_watching');
    expect(pick1.recommendation?.reason).toBe('Continue de onde parou — próximo: S01E01');

    const pick2 = await service.getNextBinge({ locale: 'en', excludeIds: [169] });
    expect(pick2.recommendation?.seriesId).toBe(300);
    expect(pick2.recommendation?.sourceTier).toBe('want_to_watch');

    const pick3 = await service.getNextBinge({ locale: 'en', excludeIds: [169, 300] });
    expect(pick3.recommendation?.seriesId).toBe(20);
    expect(pick3.recommendation?.sourceTier).toBe('genre_discovery');
    expect(pick3.recommendation?.reason).toBe('Matches your interest in Science-Fiction');
  });
});
