import bcrypt from 'bcryptjs';
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '../app';
import { closeDatabase, type DatabaseClient } from '../data/database';
import { openTestDatabase } from '../data/testDatabase';
import { signInAs, signInAsAdmin } from './routeTestAuth';

describe('Admin User Management HTTP routes integration (IT-04, IT-05, IT-06)', () => {
  let db: DatabaseClient;

  beforeEach(async () => {
    db = await openTestDatabase();
  });

  afterEach(async () => {
    await closeDatabase(db);
  });

  it('enforces ADMIN-only CRUD, CI duplicates, deactivation revocation, cascade delete, and multi-user isolation', async () => {
    const app = createApp({ db, auth: { bcryptRounds: 4 } });
    const admin = await signInAsAdmin(app);
    const clientSalt = await bcrypt.genSalt(4);
    const passwordHash = await bcrypt.hash('viewer-pass-123', clientSalt);

    const createRes = await request(app).post('/api/users').set('Cookie', admin.cookie).send({
      username: 'Viewer-One', email: 'Viewer@Example.com', role: 'USER', clientSalt, passwordHash,
    });
    expect(createRes.status).toBe(201);
    const viewerId = String(createRes.body.user.id);

    const dupRes = await request(app).post('/api/users').set('Cookie', admin.cookie).send({
      username: 'viewer-one', email: 'other@example.com', role: 'USER', clientSalt, passwordHash,
    });
    expect(dupRes.status).toBe(409);

    const viewer = await signInAs(app, 'viewer-one', 'viewer-pass-123');
    expect((await request(app).get('/api/users').set('Cookie', viewer.cookie)).status).toBe(403);

    await request(app).put('/api/preferences').set('Cookie', viewer.cookie).send({ locale: 'pt-BR' });
    await request(app).post('/api/lists').set('Cookie', viewer.cookie).send({
      name: 'Sci-Fi', entityType: 'series', icon: 'rocket', color: 'cyan',
    });
    await request(app).post('/api/lists').set('Cookie', admin.cookie).send({
      name: 'Sci-Fi', entityType: 'series', icon: 'rocket', color: 'cyan',
    });
    const adminLists = await request(app).get('/api/lists').set('Cookie', admin.cookie);
    expect(adminLists.body.customLists.map((l: { name: string }) => l.name)).toEqual(['Sci-Fi']);
    expect((await request(app).get('/api/preferences').set('Cookie', admin.cookie)).body.locale).toBeNull();

    const deactivateRes = await request(app).patch(`/api/users/${viewerId}`).set('Cookie', admin.cookie).send({ isActive: false });
    expect(deactivateRes.status).toBe(200);
    expect((await request(app).get('/api/auth/me').set('Cookie', viewer.cookie)).body.authenticated).toBe(false);

    const selfUpdate = await request(app).patch(`/api/users/${admin.userId}`).set('Cookie', admin.cookie).send({ role: 'USER' });
    expect(selfUpdate.status).toBe(403);

    const delRes = await request(app).delete(`/api/users/${viewerId}`).set('Cookie', admin.cookie);
    expect(delRes.status).toBe(204);
    expect((await request(app).get('/api/users').set('Cookie', admin.cookie)).body.users).toHaveLength(1);
  });
});
