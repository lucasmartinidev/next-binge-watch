import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createApp } from '../app';
import { closeDatabase, type DatabaseClient } from '../data/database';
import { openTestDatabase } from '../data/testDatabase';
import { signInAsAdmin } from './routeTestAuth';

function jsonRes(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
}

function makeMockFetch() {
  return vi.fn(async (input: string | URL) => {
    const url = String(input);
    if (url.includes('/search/shows')) return jsonRes([{ score: 1, show: { id: 169, name: 'Breaking Bad', genres: ['Drama'], url: 'https://tvmaze.com/s/169' } }]);
    if (url.includes('/search/people')) return jsonRes([{ score: 2, person: { id: 14229, name: 'Bryan Cranston', url: 'https://tvmaze.com/p/14229' } }]);
    if (url.includes('/shows/169?')) {
      return jsonRes({
        id: 169, name: 'Breaking Bad', url: 'https://tvmaze.com/s/169', genres: ['Drama'], rating: { average: 9.2 },
        _embedded: { cast: [], episodes: [{ id: 101, name: 'Pilot', season: 1, number: 1 }] },
      });
    }
    if (url.includes('/shows/169/akas') || url.includes('/shows/169/crew')) return jsonRes([]);
    if (url.endsWith('/people/14229')) return jsonRes({ id: 14229, name: 'Bryan Cranston', country: { name: 'United States' }, url: 'https://tvmaze.com/p/14229' });
    if (url.includes('/castcredits')) return jsonRes([{ _embedded: { show: { id: 169, name: 'Breaking Bad', url: 'https://tvmaze.com/s/169' }, character: { id: 1, name: 'Walter' } } }]);
    if (url.includes('/crewcredits')) return jsonRes([{ type: 'Producer', _embedded: { show: { id: 169, name: 'Breaking Bad', url: 'https://tvmaze.com/s/169' } } }]);
    if (url.includes('/shows?page=0')) return jsonRes([]);
    return jsonRes({}, 404);
  }) as unknown as typeof fetch;
}

describe('Custom Watchlists HTTP integration (IT-03, IT-04, IT-05)', () => {
  let db: DatabaseClient;

  beforeEach(async () => {
    db = await openTestDatabase();
  });

  afterEach(async () => {
    await closeDatabase(db);
  });

  it('supports /api/lists CRUD, primary 403 protection, 409 conflicts, and type/tag filters', async () => {
    const app = createApp({ db, fetchFn: makeMockFetch(), auth: { bcryptRounds: 4 } });
    const { cookie } = await signInAsAdmin(app);
    const initial = await request(app).get('/api/lists?lang=pt-BR').set('Cookie', cookie);
    expect(initial.status).toBe(200);
    expect(initial.body.primaryLists).toHaveLength(3);
    expect(initial.body.primaryLists[0].name).toBe('Quero Assistir');

    expect((await request(app).delete('/api/lists/want_to_watch?lang=pt-BR').set('Cookie', cookie)).status).toBe(403);
    expect((await request(app).patch('/api/lists/watching').set('Cookie', cookie).send({ name: 'Nope' })).status).toBe(403);
    const iconUpdate = await request(app).patch('/api/lists/watching').set('Cookie', cookie).send({ icon: 'flame', color: 'pink' });
    expect(iconUpdate.status).toBe(200);
    expect(iconUpdate.body.icon).toBe('flame');

    const created = await request(app).post('/api/lists').set('Cookie', cookie).send({
      name: 'Weekend Sci-Fi', description: 'Space', entityType: 'series', icon: 'rocket', color: 'cyan', tags: ['sci-fi'],
    });
    expect(created.status).toBe(201);
    const dup = await request(app).post('/api/lists').set('Cookie', cookie).send({
      name: 'weekend sci-fi', entityType: 'series', icon: 'tv', color: 'violet',
    });
    expect(dup.status).toBe(409);

    const filtered = await request(app).get('/api/lists?type=series&tag=sci-fi').set('Cookie', cookie);
    expect(filtered.body.customLists).toHaveLength(1);
    const delRes = await request(app).delete(`/api/lists/${created.body.id}`).set('Cookie', cookie);
    expect(delRes.status).toBe(204);
  });

  it('executes atomic PUT /api/series/:id/lists & /api/people/:id/lists and hydrates all 5 series & 2 person surfaces', async () => {
    const app = createApp({ db, fetchFn: makeMockFetch(), auth: { bcryptRounds: 4 } });
    const { cookie } = await signInAsAdmin(app);
    const listA = (await request(app).post('/api/lists').set('Cookie', cookie).send({ name: 'Favorites', entityType: 'series', icon: 'star', color: 'violet' })).body;
    const listB = (await request(app).post('/api/lists').set('Cookie', cookie).send({ name: 'Rewatch', entityType: 'series', icon: 'flame', color: 'orange' })).body;
    const peopleList = (await request(app).post('/api/lists').set('Cookie', cookie).send({ name: 'Icons', entityType: 'person', icon: 'users', color: 'yellow' })).body;

    const crossType = await request(app).put('/api/series/169/lists').set('Cookie', cookie).send({ primaryStatus: 'watching', customListIds: [peopleList.id] });
    expect(crossType.status).toBe(400);

    await request(app).patch('/api/lists/watching').set('Cookie', cookie).send({ icon: 'flame', color: 'pink' });
    const seriesAssign = await request(app).put('/api/series/169/lists').set('Cookie', cookie).send({ primaryStatus: 'watching', customListIds: [listA.id, listB.id] });
    expect(seriesAssign.status).toBe(200);
    expect(seriesAssign.body.lists.map((b: { id: string; systemKey: string | null }) => b.systemKey ?? b.id)).toEqual(['watching', listA.id, listB.id]);
    expect(seriesAssign.body.lists[0].icon).toBe('flame');

    const personAssign = await request(app).put('/api/people/14229/lists').set('Cookie', cookie).send({ customListIds: [peopleList.id] });
    expect(personAssign.status).toBe(200);
    expect(personAssign.body.lists.map((b: { name: string }) => b.name)).toEqual(['Icons']);

    const [searchRes, recRes, seriesRes, personRes, watchlistRes, customDetailRes] = await Promise.all([
      request(app).get('/api/search?q=br&type=all').set('Cookie', cookie),
      request(app).get('/api/recommendations/next-binge').set('Cookie', cookie),
      request(app).get('/api/series/169').set('Cookie', cookie),
      request(app).get('/api/people/14229').set('Cookie', cookie),
      request(app).get('/api/watchlist').set('Cookie', cookie),
      request(app).get(`/api/lists/${listA.id}`).set('Cookie', cookie),
    ]);
    expect(searchRes.body.items.find((i: { contentType: string }) => i.contentType === 'series').lists).toHaveLength(3);
    expect(searchRes.body.items.find((i: { contentType: string }) => i.contentType === 'person').lists).toHaveLength(1);
    expect(recRes.body.recommendation.lists).toHaveLength(3);
    expect(seriesRes.body.lists).toHaveLength(3);
    expect(personRes.body.lists).toHaveLength(1);
    expect(personRes.body.castCredits[0].lists).toHaveLength(3);
    expect(personRes.body.crewCredits[0].lists).toHaveLength(3);
    expect(watchlistRes.body.items[0].lists).toHaveLength(3);
    expect(customDetailRes.body.items[0].lists).toHaveLength(3);

    const removeItem = await request(app).delete(`/api/lists/${listA.id}/items/169`).set('Cookie', cookie);
    expect(removeItem.status).toBe(204);
  });
});
