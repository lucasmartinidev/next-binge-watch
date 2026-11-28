import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createApp } from '../app';
import { closeDatabase, type DatabaseClient } from '../data/database';
import { openTestDatabase } from '../data/testDatabase';
import { signInAsAdmin } from './routeTestAuth';

function makeJsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
}

describe('Watchlist, Recommendations, and Preferences HTTP integration (IT-04)', () => {
  let db: DatabaseClient;

  beforeEach(async () => {
    db = await openTestDatabase();
  });

  afterEach(async () => {
    await closeDatabase(db);
  });

  function makeMockFetch() {
    return vi.fn(async (input: string | URL) => {
      const url = String(input);
      if (url.includes('/shows/169?')) {
        return makeJsonResponse({
          id: 169, name: 'Breaking Bad', url: 'https://tvmaze.com/s/169', genres: ['Drama'], rating: { average: 9.2 },
          _embedded: { episodes: [{ id: 101, name: 'Pilot', season: 1, number: 1 }, { id: 102, name: 'Cat', season: 1, number: 2 }] },
        });
      }
      if (url.includes('/shows/169/akas')) return makeJsonResponse([{ name: 'Breaking Bad: A Química do Mal', country: { code: 'BR' } }]);
      if (url.includes('/shows?page=0')) {
        return makeJsonResponse([{ id: 50, name: 'Discovery Show', url: 'https://tvmaze.com/s/50', genres: ['Drama'], rating: { average: 8.7 } }]);
      }
      return makeJsonResponse({}, 404);
    }) as unknown as typeof fetch;
  }

  it('persists watchlist CRUD, episode/season toggles, and status filters in PostgreSQL', async () => {
    const app = createApp({ db, fetchFn: makeMockFetch(), auth: { bcryptRounds: 4 } });
    const { cookie } = await signInAsAdmin(app);
    const createRes = await request(app).post('/api/watchlist?lang=pt-BR').set('Cookie', cookie).send({ seriesId: 169, status: 'want_to_watch' });
    expect(createRes.status).toBe(201);
    expect(createRes.body.localizedName).toBe('Breaking Bad: A Química do Mal');

    const epRes = await request(app).put('/api/watchlist/169/episodes/101').set('Cookie', cookie).send({ watched: true });
    expect(epRes.status).toBe(200);
    expect(epRes.body.status).toBe('watching');

    const listRes = await request(app).get('/api/watchlist?status=watching&lang=pt-BR').set('Cookie', cookie);
    expect(listRes.status).toBe(200);
    expect(listRes.body.total).toBe(1);
    expect(listRes.body.items[0].nextEpisode.id).toBe(102);

    const seasonRes = await request(app).put('/api/watchlist/169/seasons/1').set('Cookie', cookie).send({ watched: true });
    expect(seasonRes.status).toBe(200);
    expect(seasonRes.body.status).toBe('watched');

    const patchRes = await request(app).patch('/api/watchlist/169').set('Cookie', cookie).send({ status: 'want_to_watch' });
    expect(patchRes.status).toBe(200);
    expect(patchRes.body.status).toBe('want_to_watch');

    expect((await request(app).delete('/api/watchlist/169').set('Cookie', cookie)).status).toBe(204);
    expect((await request(app).get('/api/watchlist').set('Cookie', cookie)).body.total).toBe(0);
  });

  it('returns Next Binge Watch recommendations for empty/anonymous and active watchlists', async () => {
    const app = createApp({ db, fetchFn: makeMockFetch(), auth: { bcryptRounds: 4 } });
    const { cookie } = await signInAsAdmin(app);
    const emptyRec = await request(app).get('/api/recommendations/next-binge?lang=en');
    expect(emptyRec.status).toBe(200);
    expect(emptyRec.body.recommendation.seriesId).toBe(50);

    await request(app).post('/api/watchlist').set('Cookie', cookie).send({ seriesId: 169, status: 'watching' });
    const activeRec = await request(app).get('/api/recommendations/next-binge?lang=en').set('Cookie', cookie);
    expect(activeRec.status).toBe(200);
    expect(activeRec.body.recommendation.seriesId).toBe(169);
    expect(activeRec.body.recommendation.sourceTier).toBe('continue_watching');

    const badExclude = await request(app).get('/api/recommendations/next-binge?excludeIds=abc&lang=pt-BR');
    expect(badExclude.status).toBe(400);
  });

  it('persists user preferences and validates locale values', async () => {
    const app = createApp({ db, fetchFn: makeMockFetch(), auth: { bcryptRounds: 4 } });
    const { cookie } = await signInAsAdmin(app);
    const initial = await request(app).get('/api/preferences').set('Cookie', cookie);
    expect(initial.status).toBe(200);
    expect(initial.body.locale).toBeNull();

    const updated = await request(app).put('/api/preferences').set('Cookie', cookie).send({ locale: 'pt-BR' });
    expect(updated.status).toBe(200);
    expect(updated.body.locale).toBe('pt-BR');

    const invalid = await request(app).put('/api/preferences?lang=pt-BR').set('Cookie', cookie).send({ locale: 'es-ES' });
    expect(invalid.status).toBe(400);
    expect(invalid.body.error.message).toBe('O idioma deve ser en ou pt-BR.');
  });
});
