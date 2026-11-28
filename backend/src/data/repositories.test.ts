import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { closeDatabase, pingDatabase, type DatabaseClient } from './database';
import { PreferencesRepository } from './preferencesRepository';
import { openTestDatabase, resetTestDatabase } from './testDatabase';
import { WatchedEpisodeRepository } from './watchedEpisodeRepository';
import { WatchlistRepository } from './watchlistRepository';

describe('PostgreSQL repositories (IT-02, IT-06)', () => {
  let db: DatabaseClient;
  let adminId: string;

  beforeEach(async () => {
    db = await openTestDatabase();
    adminId = await resetTestDatabase(db);
  });

  afterEach(async () => {
    await closeDatabase(db);
  });

  it('pings PostgreSQL and persists user-scoped watchlist, JSONB genres, and episode progress with cascade delete', async () => {
    expect(await pingDatabase(db)).toBe(true);
    const watchlistRepo = new WatchlistRepository(db);
    const episodeRepo = new WatchedEpisodeRepository(db);
    expect(await watchlistRepo.findBySeriesId(adminId, 999)).toBeNull();
    expect(await watchlistRepo.updateStatus({ userId: adminId, seriesId: 999, status: 'watched' })).toBe(false);
    expect(await watchlistRepo.deleteBySeriesId(adminId, 999)).toBe(false);
    await episodeRepo.markEpisodes([]);
    await episodeRepo.unmarkEpisodes(adminId, 169, []);
    await watchlistRepo.upsert({
      userId: adminId, seriesId: 169, name: 'Breaking Bad', localizedNamePtBr: 'Breaking Bad: A Química do Mal',
      imageUrl: 'https://example.com/poster.jpg', status: 'watching', genres: ['Drama', 'Crime'],
      rating: 9.2, totalEpisodes: 62, tvmazeUrl: 'https://www.tvmaze.com/shows/169/breaking-bad',
    });
    await episodeRepo.markEpisodes([
      { userId: adminId, seriesId: 169, episodeId: 12192, seasonNumber: 1, episodeNumber: 1 },
      { userId: adminId, seriesId: 169, episodeId: 12193, seasonNumber: 1, episodeNumber: 2 },
    ]);
    await episodeRepo.markEpisodes([
      { userId: adminId, seriesId: 169, episodeId: 12192, seasonNumber: 1, episodeNumber: 1 },
    ]);
    const item = await watchlistRepo.findBySeriesId(adminId, 169);
    expect(item?.status).toBe('watching');
    expect(item?.genres).toEqual(['Drama', 'Crime']);
    expect(item?.rating).toBe(9.2);
    expect((await watchlistRepo.listAll(adminId)).length).toBe(1);
    expect((await episodeRepo.listBySeriesId(adminId, 169)).length).toBe(2);
    expect((await episodeRepo.listAllCounts(adminId)).get(169)).toBe(2);
    await episodeRepo.unmarkEpisodes(adminId, 169, [12193]);
    expect((await episodeRepo.listBySeriesId(adminId, 169)).length).toBe(1);
    expect(await watchlistRepo.updateStatus({ userId: adminId, seriesId: 169, status: 'watched' })).toBe(true);
    expect((await watchlistRepo.listAll(adminId, 'watched')).length).toBe(1);
    expect(await watchlistRepo.deleteBySeriesId(adminId, 169)).toBe(true);
    expect((await episodeRepo.listBySeriesId(adminId, 169)).length).toBe(0);
  });

  it('persists and isolates user locale preferences in PostgreSQL (IT-06)', async () => {
    const repo = new PreferencesRepository(db);
    expect(await repo.getPreferences(adminId)).toEqual({ locale: null, updatedAt: null });
    const savedPt = await repo.setLocale(adminId, 'pt-BR');
    expect(savedPt.locale).toBe('pt-BR');
    expect((await repo.getPreferences(adminId)).locale).toBe('pt-BR');
    const savedEn = await repo.setLocale(adminId, 'en');
    expect(savedEn.locale).toBe('en');
    expect((await repo.getPreferences(adminId)).locale).toBe('en');
  });
});
