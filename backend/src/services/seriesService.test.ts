import { describe, expect, it, vi } from 'vitest';
import type { TvmazeClient } from '../data/tvmazeClient';
import type { WatchedEpisodeRepository } from '../data/watchedEpisodeRepository';
import type { WatchlistRepository } from '../data/watchlistRepository';
import { SeriesService } from './seriesService';

const USER_A = '11111111-1111-1111-1111-111111111111';

describe('SeriesService (UT-04)', () => {
  const sampleShow = {
    id: 169, url: 'https://www.tvmaze.com/shows/169/breaking-bad', name: 'Breaking Bad',
    type: 'Scripted', genres: ['Drama'], status: 'Ended', premiered: '2008-01-20', ended: '2013-09-29',
    rating: { average: 9.2 }, network: { name: 'AMC' }, image: { original: 'https://img.example/bb-orig.jpg' },
    summary: '<p>Chemistry teacher turns cook.</p>',
    _embedded: {
      cast: [{ person: { id: 14229, name: 'Bryan Cranston', url: 'https://tvmaze.com/p/14229', image: null }, character: { id: 1, name: 'Walter White' } }],
      episodes: [
        { id: 101, name: 'Pilot', season: 1, number: 1, airdate: '2008-01-20', summary: '<p>Ep 1</p>' },
        { id: 102, name: 'Cat', season: 1, number: 2, airdate: '2008-01-27', summary: null },
      ],
    },
  };

  it('computes progress, next episode, and pt-BR AKA when authenticated', async () => {
    const tvmaze = {
      getShowWithEmbeds: vi.fn().mockResolvedValue(sampleShow),
      getShowCrew: vi.fn().mockResolvedValue([{ type: 'Creator', person: { id: 31870, name: 'Vince Gilligan', url: 'https://tvmaze.com/p/31870' } }]),
      getShowAkas: vi.fn().mockResolvedValue([{ name: 'Breaking Bad: A Química do Mal', country: { code: 'BR' } }]),
    } as unknown as TvmazeClient;
    const watchlistRepo = { findBySeriesId: vi.fn().mockResolvedValue({ status: 'watching' }) } as unknown as WatchlistRepository;
    const episodeRepo = { listBySeriesId: vi.fn().mockResolvedValue([{ episodeId: 101 }]) } as unknown as WatchedEpisodeRepository;
    const service = new SeriesService(tvmaze, watchlistRepo, episodeRepo);
    const profile = await service.getSeriesProfile({ id: 169, locale: 'pt-BR', userId: USER_A });
    expect(profile.localizedName).toBe('Breaking Bad: A Química do Mal');
    expect(profile.tracking).toEqual({
      inWatchlist: true, status: 'watching', watchedEpisodes: 1, totalEpisodes: 2, progressPercent: 50,
      nextEpisode: { id: 102, season: 1, number: 2, name: 'Cat', airdate: '2008-01-27' },
    });
  });

  it('omits personal tracking and degrades gracefully with partialData true when crew and akas fail', async () => {
    const tvmaze = {
      getShowWithEmbeds: vi.fn().mockResolvedValue(sampleShow),
      getShowCrew: vi.fn().mockRejectedValue(new Error('crew error')),
      getShowAkas: vi.fn().mockRejectedValue(new Error('akas error')),
    } as unknown as TvmazeClient;
    const watchlistRepo = { findBySeriesId: vi.fn() } as unknown as WatchlistRepository;
    const episodeRepo = { listBySeriesId: vi.fn() } as unknown as WatchedEpisodeRepository;
    const service = new SeriesService(tvmaze, watchlistRepo, episodeRepo);
    const profile = await service.getSeriesProfile({ id: 169, locale: 'pt-BR' });
    expect(profile.tracking.inWatchlist).toBe(false);
    expect(profile.lists).toEqual([]);
    expect(watchlistRepo.findBySeriesId).not.toHaveBeenCalled();
    expect(profile.partialData).toBe(true);
  });
});
