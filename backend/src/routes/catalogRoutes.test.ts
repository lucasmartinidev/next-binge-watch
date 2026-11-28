import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createApp } from '../app';
import { closeDatabase, type DatabaseClient } from '../data/database';
import { openTestDatabase } from '../data/testDatabase';
import { WatchlistRepository } from '../data/watchlistRepository';
import { WatchedEpisodeRepository } from '../data/watchedEpisodeRepository';
import { signInAsAdmin } from './routeTestAuth';

function makeJsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
}

describe('Catalog HTTP routes integration (IT-03)', () => {
  let db: DatabaseClient;

  beforeEach(async () => {
    db = await openTestDatabase();
  });

  afterEach(async () => {
    await closeDatabase(db);
  });

  it('GET /api/search validates input in pt-BR/en and proxies TVmaze publicly', async () => {
    const fetchFn = vi.fn(async (input: string | URL) => {
      const url = String(input);
      if (url.includes('/search/shows')) {
        return makeJsonResponse([{ score: 1, show: { id: 169, name: 'Breaking Bad', url: 'https://tvmaze.com/s/169' } }]);
      }
      return makeJsonResponse([]);
    }) as unknown as typeof fetch;
    const app = createApp({ db, fetchFn, auth: { bcryptRounds: 4 } });
    const badRes = await request(app).get('/api/search?q=&lang=pt-BR');
    expect(badRes.status).toBe(400);
    expect(badRes.body.error.message).toBe('Informe um termo de busca com pelo menos 1 caractere.');

    const okRes = await request(app).get('/api/search?q=break&type=series&lang=en');
    expect(okRes.status).toBe(200);
    expect(okRes.body.total).toBe(1);
    expect(okRes.body.items[0].name).toBe('Breaking Bad');
  });

  it('GET /api/series/:id merges PostgreSQL tracking state and pt-BR AKA when authenticated and omits when anonymous', async () => {
    const fetchFn = vi.fn(async (input: string | URL) => {
      const url = String(input);
      if (url.includes('/shows/169?')) {
        return makeJsonResponse({
          id: 169, name: 'Breaking Bad', url: 'https://tvmaze.com/s/169',
          _embedded: { cast: [], episodes: [{ id: 101, name: 'Pilot', season: 1, number: 1 }] },
        });
      }
      if (url.includes('/crew')) return makeJsonResponse([]);
      if (url.includes('/akas')) return makeJsonResponse([{ name: 'Breaking Bad: A Química do Mal', country: { code: 'BR' } }]);
      return makeJsonResponse({}, 404);
    }) as unknown as typeof fetch;
    const app = createApp({ db, fetchFn, auth: { bcryptRounds: 4 } });
    const { cookie, userId } = await signInAsAdmin(app);
    const watchlistRepo = new WatchlistRepository(db);
    const episodeRepo = new WatchedEpisodeRepository(db);
    await watchlistRepo.upsert({
      userId, seriesId: 169, name: 'Breaking Bad', localizedNamePtBr: null, imageUrl: null,
      status: 'watching', genres: ['Drama'], rating: 9.2, totalEpisodes: 1, tvmazeUrl: 'https://tvmaze.com/s/169',
    });
    await episodeRepo.markEpisodes([{ userId, seriesId: 169, episodeId: 101, seasonNumber: 1, episodeNumber: 1 }]);

    const anonRes = await request(app).get('/api/series/169?lang=pt-BR');
    expect(anonRes.status).toBe(200);
    expect(anonRes.body.tracking.inWatchlist).toBe(false);
    expect(anonRes.body.lists).toEqual([]);

    const authRes = await request(app).get('/api/series/169?lang=pt-BR').set('Cookie', cookie);
    expect(authRes.status).toBe(200);
    expect(authRes.body.localizedName).toBe('Breaking Bad: A Química do Mal');
    expect(authRes.body.tracking.progressPercent).toBe(100);

    const notFound = await request(app).get('/api/series/999999?lang=en');
    expect(notFound.status).toBe(404);
  });

  it('GET /api/people/:id returns credits publicly and handles partial degradation', async () => {
    const fetchFn = vi.fn(async (input: string | URL) => {
      const url = String(input);
      if (url.endsWith('/people/14229')) return makeJsonResponse({ id: 14229, name: 'Bryan Cranston', url: 'https://tvmaze.com/p/14229' });
      if (url.includes('/castcredits')) {
        return makeJsonResponse([{ _embedded: { show: { id: 169, name: 'Breaking Bad', url: 'u' }, character: { id: 1, name: 'Walter' } } }]);
      }
      return makeJsonResponse({}, 500);
    }) as unknown as typeof fetch;
    const app = createApp({ db, fetchFn, auth: { bcryptRounds: 4 } });
    const res = await request(app).get('/api/people/14229?lang=en');
    expect(res.status).toBe(200);
    expect(res.body.castCredits).toHaveLength(1);
    expect(res.body.crewCredits).toBeNull();
    expect(res.body.partialData).toBe(true);
  });
});
