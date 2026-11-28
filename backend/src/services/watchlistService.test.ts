import { describe, expect, it, vi } from 'vitest';
import type { TvmazeClient } from '../data/tvmazeClient';
import { EpisodeTrackingService } from './episodeTrackingService';
import { createInMemoryRepositories } from './inMemoryRepositories';
import { WatchlistService } from './watchlistService';

const USER_A = '11111111-1111-1111-1111-111111111111';
const USER_B = '22222222-2222-2222-2222-222222222222';

describe('WatchlistService & EpisodeTrackingService (UT-04)', () => {
  const sampleShow = {
    id: 169,
    url: 'https://www.tvmaze.com/shows/169/breaking-bad',
    name: 'Breaking Bad',
    genres: ['Drama'],
    rating: { average: 9.2 },
    image: { medium: 'https://img.example/bb.jpg' },
    _embedded: {
      episodes: [
        { id: 101, name: 'Pilot', season: 1, number: 1, airdate: '2008-01-20' },
        { id: 102, name: 'Cat', season: 1, number: 2, airdate: '2008-01-27' },
        { id: 201, name: 'Seven', season: 2, number: 1, airdate: '2009-03-08' },
      ],
    },
  };

  it('auto-transitions want_to_watch -> watching -> watched -> watching across episode and season toggles', async () => {
    const tvmaze = {
      getShowWithEmbeds: vi.fn().mockResolvedValue(sampleShow),
      getShowAkas: vi.fn().mockResolvedValue([{ name: 'Breaking Bad: A Química do Mal', country: { code: 'BR' } }]),
    } as unknown as TvmazeClient;
    const { watchlistRepo, episodeRepo } = createInMemoryRepositories();
    const watchlistService = new WatchlistService(tvmaze, watchlistRepo, episodeRepo);
    const trackingService = new EpisodeTrackingService(tvmaze, watchlistRepo, episodeRepo);

    const added = await watchlistService.addSeries({ userId: USER_A, seriesId: 169, status: 'want_to_watch', locale: 'pt-BR' });
    expect(added.localizedName).toBe('Breaking Bad: A Química do Mal');
    expect((await watchlistService.list({ userId: USER_B, locale: 'en' })).items).toHaveLength(0);

    const afterEp1 = await trackingService.toggleEpisode({ userId: USER_A, seriesId: 169, episodeId: 101, watched: true });
    expect(afterEp1.status).toBe('watching');
    expect(afterEp1.watchedEpisodes).toBe(1);
    expect(afterEp1.nextEpisode?.id).toBe(102);

    const afterS1 = await trackingService.toggleSeason({ userId: USER_A, seriesId: 169, seasonNumber: 1, watched: true });
    expect(afterS1.status).toBe('watching');
    expect(afterS1.watchedEpisodes).toBe(2);

    const afterS2 = await trackingService.toggleSeason({ userId: USER_A, seriesId: 169, seasonNumber: 2, watched: true });
    expect(afterS2.status).toBe('watched');
    expect(afterS2.progressPercent).toBe(100);
    expect(afterS2.nextEpisode).toBeNull();

    const afterUnwatch = await trackingService.toggleEpisode({ userId: USER_A, seriesId: 169, episodeId: 201, watched: false });
    expect(afterUnwatch.status).toBe('watching');
    expect(afterUnwatch.watchedEpisodes).toBe(2);
  });

  it('auto-adds an untracked series as watching when marking an episode watched', async () => {
    const tvmaze = { getShowWithEmbeds: vi.fn().mockResolvedValue(sampleShow) } as unknown as TvmazeClient;
    const { watchlistRepo, episodeRepo } = createInMemoryRepositories();
    const trackingService = new EpisodeTrackingService(tvmaze, watchlistRepo, episodeRepo);

    const state = await trackingService.toggleEpisode({ userId: USER_A, seriesId: 169, episodeId: 101, watched: true });
    expect(state.inWatchlist).toBe(true);
    expect(state.status).toBe('watching');
  });
});
