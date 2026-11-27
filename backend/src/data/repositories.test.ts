import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { closeDatabase, pingDatabase, type DatabaseClient } from './database';
import { PreferencesRepository } from './preferencesRepository';
import { openTestDatabase } from './testDatabase';
import { WatchedEpisodeRepository } from './watchedEpisodeRepository';
import { WatchlistRepository } from './watchlistRepository';

describe('PostgreSQL repositories (IT-02)', () => {
  let db: DatabaseClient;

  beforeEach(async () => {
    db = await openTestDatabase();
  });

  afterEach(async () => {
    await closeDatabase(db);
  });

  it('pings PostgreSQL and persists watchlist, JSONB genres, and episode progress with cascade delete', async () => {
    expect(await pingDatabase(db)).toBe(true);
    const watchlistRepo = new WatchlistRepository(db);
    const episodeRepo = new WatchedEpisodeRepository(db);
    expect(await watchlistRepo.findBySeriesId(999)).toBeNull();
    expect(await watchlistRepo.updateStatus(999, 'watched')).toBe(false);
    expect(await watchlistRepo.deleteBySeriesId(999)).toBe(false);
    await episodeRepo.markEpisodes([]);
    await episodeRepo.unmarkEpisodes(169, []);
    await watchlistRepo.upsert({
      seriesId: 169,
      name: 'Breaking Bad',
      localizedNamePtBr: 'Breaking Bad: A Química do Mal',
      imageUrl: 'https://example.com/poster.jpg',
      status: 'watching',
      genres: ['Drama', 'Crime'],
      rating: 9.2,
      totalEpisodes: 62,
      tvmazeUrl: 'https://www.tvmaze.com/shows/169/breaking-bad',
    });
    await episodeRepo.markEpisodes([
      { seriesId: 169, episodeId: 12192, seasonNumber: 1, episodeNumber: 1 },
      { seriesId: 169, episodeId: 12193, seasonNumber: 1, episodeNumber: 2 },
    ]);
    await episodeRepo.markEpisodes([
      { seriesId: 169, episodeId: 12192, seasonNumber: 1, episodeNumber: 1 },
    ]);
    const item = await watchlistRepo.findBySeriesId(169);
    expect(item?.status).toBe('watching');
    expect(item?.genres).toEqual(['Drama', 'Crime']);
    expect(item?.rating).toBe(9.2);
    expect((await watchlistRepo.listAll()).length).toBe(1);
    expect((await episodeRepo.listBySeriesId(169)).length).toBe(2);
    expect((await episodeRepo.listAllCounts()).get(169)).toBe(2);
    await episodeRepo.unmarkEpisodes(169, [12193]);
    expect((await episodeRepo.listBySeriesId(169)).length).toBe(1);
    expect(await watchlistRepo.updateStatus(169, 'watched')).toBe(true);
    expect((await watchlistRepo.listAll('watched')).length).toBe(1);
    expect(await watchlistRepo.deleteBySeriesId(169)).toBe(true);
    expect((await episodeRepo.listBySeriesId(169)).length).toBe(0);
  });

  it('persists and updates user locale preference in PostgreSQL', async () => {
    const repo = new PreferencesRepository(db);
    expect(await repo.getPreferences()).toEqual({ locale: null, updatedAt: null });
    const savedPt = await repo.setLocale('pt-BR');
    expect(savedPt.locale).toBe('pt-BR');
    expect((await repo.getPreferences()).locale).toBe('pt-BR');
    const savedEn = await repo.setLocale('en');
    expect(savedEn.locale).toBe('en');
    expect((await repo.getPreferences()).locale).toBe('en');
  });
});
