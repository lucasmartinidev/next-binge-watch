import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createApp } from '../app';
import { closeDatabase, createDatabase, type DatabaseClient } from '../data/database';
import { WatchlistRepository } from '../data/watchlistRepository';
import { WatchedEpisodeRepository } from '../data/watchedEpisodeRepository';

function makeJsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

describe('Catalog HTTP routes integration (IT-01, IT-02, IT-03)', () => {
  let db: DatabaseClient;

  beforeEach(async () => {
    db = await createDatabase(':memory:');
  });

  afterEach(async () => {
    await closeDatabase(db);
  });

  it('GET /api/search validates input in pt-BR/en and proxies TVmaze (IT-01)', async () => {
    const fetchFn = vi.fn(async (input: string | URL) => {
      const url = String(input);
      if (url.includes('/search/shows')) {
        return makeJsonResponse([{ score: 1, show: { id: 169, name: 'Breaking Bad', url: 'https://tvmaze.com/s/169' } }]);
      }
      return makeJsonResponse([]);
    }) as unknown as typeof fetch;
    const app = createApp({ db, fetchFn });
    const badRes = await request(app).get('/api/search?q=&lang=pt-BR');
    expect(badRes.status).toBe(400);
    expect(badRes.body.error.message).toBe('Informe um termo de busca com pelo menos 1 caractere.');

    const okRes = await request(app).get('/api/search?q=break&type=series&lang=en');
    expect(okRes.status).toBe(200);
    expect(okRes.body.total).toBe(1);
    expect(okRes.body.items[0].name).toBe('Breaking Bad');
  });

  it('GET /api/series/:id merges SQLite tracking state and pt-BR AKA (IT-02)', async () => {
    const watchlistRepo = new WatchlistRepository(db);
    const episodeRepo = new WatchedEpisodeRepository(db);
    await watchlistRepo.upsert({
      seriesId: 169,
      name: 'Breaking Bad',
      localizedNamePtBr: null,
      imageUrl: null,
      status: 'watching',
      genres: ['Drama'],
      rating: 9.2,
      totalEpisodes: 1,
      tvmazeUrl: 'https://tvmaze.com/s/169',
    });
    await episodeRepo.markEpisodes([{ seriesId: 169, episodeId: 101, seasonNumber: 1, episodeNumber: 1 }]);
    const fetchFn = vi.fn(async (input: string | URL) => {
      const url = String(input);
      if (url.includes('/shows/169?')) {
        return makeJsonResponse({
          id: 169,
          name: 'Breaking Bad',
          url: 'https://tvmaze.com/s/169',
          _embedded: { cast: [], episodes: [{ id: 101, name: 'Pilot', season: 1, number: 1 }] },
        });
      }
      if (url.includes('/crew')) {
        return makeJsonResponse([]);
      }
      if (url.includes('/akas')) {
        return makeJsonResponse([{ name: 'Breaking Bad: A Química do Mal', country: { code: 'BR' } }]);
      }
      return makeJsonResponse({}, 404);
    }) as unknown as typeof fetch;
    const app = createApp({ db, fetchFn });
    const res = await request(app).get('/api/series/169?lang=pt-BR');
    expect(res.status).toBe(200);
    expect(res.body.localizedName).toBe('Breaking Bad: A Química do Mal');
    expect(res.body.tracking.progressPercent).toBe(100);

    const notFound = await request(app).get('/api/series/999999?lang=en');
    expect(notFound.status).toBe(404);
  });

  it('GET /api/people/:id returns credits and handles partial degradation (IT-03)', async () => {
    const fetchFn = vi.fn(async (input: string | URL) => {
      const url = String(input);
      if (url.endsWith('/people/14229')) {
        return makeJsonResponse({ id: 14229, name: 'Bryan Cranston', url: 'https://tvmaze.com/p/14229' });
      }
      if (url.includes('/castcredits')) {
        return makeJsonResponse([{ _embedded: { show: { id: 169, name: 'Breaking Bad', url: 'u' }, character: { id: 1, name: 'Walter' } } }]);
      }
      return makeJsonResponse({}, 500);
    }) as unknown as typeof fetch;
    const app = createApp({ db, fetchFn });
    const res = await request(app).get('/api/people/14229?lang=en');
    expect(res.status).toBe(200);
    expect(res.body.castCredits).toHaveLength(1);
    expect(res.body.crewCredits).toBeNull();
    expect(res.body.partialData).toBe(true);
  });
});
