import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { closeDatabase, createDatabase, type DatabaseClient } from '../data/database';
import type { TvmazeClient } from '../data/tvmazeClient';
import { WatchedEpisodeRepository } from '../data/watchedEpisodeRepository';
import { WatchlistRepository } from '../data/watchlistRepository';
import { AppError } from '../types/error';
import { RecommendationService } from './recommendationService';

describe('RecommendationService discovery degradation (UT-07 regression)', () => {
  let db: DatabaseClient;

  beforeEach(async () => {
    db = await createDatabase(':memory:');
  });

  afterEach(async () => {
    await closeDatabase(db);
  });

  function makeTimingOutTvmaze(): TvmazeClient {
    return {
      getShowsPage: vi.fn().mockRejectedValue(new AppError('UPSTREAM_TIMEOUT', 'upstream.timeout')),
      getShowWithEmbeds: vi.fn().mockResolvedValue(null),
    } as unknown as TvmazeClient;
  }

  it('serves watchlist picks when the TVmaze discovery catalog times out', async () => {
    const watchlistRepo = new WatchlistRepository(db);
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
    const service = new RecommendationService(makeTimingOutTvmaze(), watchlistRepo, new WatchedEpisodeRepository(db));
    const result = await service.getNextBinge({ locale: 'en', excludeIds: [] });
    expect(result.recommendation?.seriesId).toBe(300);
    expect(result.recommendation?.sourceTier).toBe('want_to_watch');
    expect(result.hasMore).toBe(false);
  });

  it('propagates the upstream error when the watchlist offers no fallback pick', async () => {
    const service = new RecommendationService(
      makeTimingOutTvmaze(),
      new WatchlistRepository(db),
      new WatchedEpisodeRepository(db),
    );
    await expect(service.getNextBinge({ locale: 'en', excludeIds: [] })).rejects.toMatchObject({
      code: 'UPSTREAM_TIMEOUT',
      statusCode: 504,
    });
  });
});
