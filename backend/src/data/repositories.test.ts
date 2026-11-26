import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { closeDatabase, createDatabase, pingDatabase, type DatabaseClient } from './database';
import { PreferencesRepository } from './preferencesRepository';
import { WatchedEpisodeRepository } from './watchedEpisodeRepository';
import { WatchlistRepository } from './watchlistRepository';

describe('SQLite repositories', () => {
  let db: DatabaseClient;

  beforeEach(async () => {
    db = await createDatabase(':memory:');
  });

  afterEach(async () => {
    await closeDatabase(db);
  });

  it('creates parent directory for file-based database URLs', async () => {
    const tempDir = await mkdtemp(join(tmpdir(), 'nbw-db-'));
    const fileDb = await createDatabase(`file:${join(tempDir, 'nested', 'test.db')}`);
    expect(await pingDatabase(fileDb)).toBe(true);
    await closeDatabase(fileDb);
    await rm(tempDir, { recursive: true, force: true });
  });

  it('pings database and persists watchlist and episode progress with cascade delete', async () => {
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
    const item = await watchlistRepo.findBySeriesId(169);
    expect(item?.status).toBe('watching');
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

  it('persists and retrieves user locale preference', async () => {
    const repo = new PreferencesRepository(db);
    expect(await repo.getPreferences()).toEqual({ locale: null, updatedAt: null });
    const saved = await repo.setLocale('pt-BR');
    expect(saved.locale).toBe('pt-BR');
    expect((await repo.getPreferences()).locale).toBe('pt-BR');
  });
});
