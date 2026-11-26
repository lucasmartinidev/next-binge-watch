import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { closeDatabase, createDatabase, type DatabaseClient } from '../data/database';
import type { TvmazeClient } from '../data/tvmazeClient';
import { WatchedEpisodeRepository } from '../data/watchedEpisodeRepository';
import { WatchlistRepository } from '../data/watchlistRepository';
import { EpisodeTrackingService } from './episodeTrackingService';
import { WatchlistService } from './watchlistService';

describe('WatchlistService & EpisodeTrackingService (UT-06)', () => {
  let db: DatabaseClient;
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

  beforeEach(async () => {
    db = await createDatabase(':memory:');
  });

  afterEach(async () => {
    await closeDatabase(db);
  });

  it('auto-transitions want_to_watch -> watching -> watched -> watching across episode and season toggles', async () => {
    const tvmaze = {
      getShowWithEmbeds: vi.fn().mockResolvedValue(sampleShow),
      getShowAkas: vi.fn().mockResolvedValue([{ name: 'Breaking Bad: A Química do Mal', country: { code: 'BR' } }]),
    } as unknown as TvmazeClient;
    const watchlistRepo = new WatchlistRepository(db);
    const episodeRepo = new WatchedEpisodeRepository(db);
    const watchlistService = new WatchlistService(tvmaze, watchlistRepo, episodeRepo);
    const trackingService = new EpisodeTrackingService(tvmaze, watchlistRepo, episodeRepo);

    const added = await watchlistService.addSeries({ seriesId: 169, status: 'want_to_watch', locale: 'pt-BR' });
    expect(added.localizedName).toBe('Breaking Bad: A Química do Mal');

    const afterEp1 = await trackingService.toggleEpisode({ seriesId: 169, episodeId: 101, watched: true });
    expect(afterEp1.status).toBe('watching');
    expect(afterEp1.watchedEpisodes).toBe(1);
    expect(afterEp1.nextEpisode?.id).toBe(102);

    const afterS1 = await trackingService.toggleSeason({ seriesId: 169, seasonNumber: 1, watched: true });
    expect(afterS1.status).toBe('watching');
    expect(afterS1.watchedEpisodes).toBe(2);

    const afterS2 = await trackingService.toggleSeason({ seriesId: 169, seasonNumber: 2, watched: true });
    expect(afterS2.status).toBe('watched');
    expect(afterS2.progressPercent).toBe(100);
    expect(afterS2.nextEpisode).toBeNull();

    const afterUnwatch = await trackingService.toggleEpisode({ seriesId: 169, episodeId: 201, watched: false });
    expect(afterUnwatch.status).toBe('watching');
    expect(afterUnwatch.watchedEpisodes).toBe(2);
  });

  it('auto-adds an untracked series as watching when marking an episode watched', async () => {
    const tvmaze = { getShowWithEmbeds: vi.fn().mockResolvedValue(sampleShow) } as unknown as TvmazeClient;
    const watchlistRepo = new WatchlistRepository(db);
    const episodeRepo = new WatchedEpisodeRepository(db);
    const trackingService = new EpisodeTrackingService(tvmaze, watchlistRepo, episodeRepo);

    const state = await trackingService.toggleEpisode({ seriesId: 169, episodeId: 101, watched: true });
    expect(state.inWatchlist).toBe(true);
    expect(state.status).toBe('watching');
  });
});
