import bcrypt from 'bcryptjs';
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '../app';
import { loadAuthConfig } from '../config/authConfig';
import { closeDatabase, type DatabaseClient } from '../data/database';
import { openTestDatabase } from '../data/testDatabase';
import { signInAs, signInAsAdmin } from './routeTestAuth';

describe('Auth HTTP routes integration (IT-02, IT-03, IT-04, IT-07)', () => {
  let db: DatabaseClient;

  beforeEach(async () => {
    db = await openTestDatabase();
  });

  afterEach(async () => {
    await closeDatabase(db);
  });

  it('completes challenge -> login -> /api/auth/me -> logout lifecycle (IT-02)', async () => {
    const app = createApp({ db, auth: { bcryptRounds: 4 } });
    const { initialAdmin } = loadAuthConfig();
    expect((await request(app).get('/api/auth/me')).body).toEqual({ authenticated: false, user: null });

    const { cookie } = await signInAs(app, initialAdmin.email.toUpperCase(), initialAdmin.password);
    expect(cookie).toContain('nbw_session=');
    const meRes = await request(app).get('/api/auth/me').set('Cookie', cookie);
    expect(meRes.status).toBe(200);
    expect(meRes.body.authenticated).toBe(true);
    expect(meRes.body.user.username).toBe(initialAdmin.username);

    const logoutRes = await request(app).post('/api/auth/logout').set('Cookie', cookie);
    expect(logoutRes.status).toBe(204);
    expect((await request(app).get('/api/auth/me').set('Cookie', cookie)).body.authenticated).toBe(false);
  });

  it('changes password and revokes other sessions while keeping active session (IT-03)', async () => {
    const app = createApp({ db, auth: { bcryptRounds: 4 } });
    const { initialAdmin } = loadAuthConfig();
    const sessionA = await signInAsAdmin(app);
    const sessionB = await signInAsAdmin(app);
    const challengeRes = await request(app).get('/api/auth/password-challenge').set('Cookie', sessionB.cookie);
    expect(challengeRes.status).toBe(200);

    const currentPasswordHash = await bcrypt.hash(initialAdmin.password, challengeRes.body.salt as string);
    const newClientSalt = await bcrypt.genSalt(4);
    const newPasswordHash = await bcrypt.hash('new-secret-pass', newClientSalt);
    const changeRes = await request(app)
      .post('/api/auth/change-password')
      .set('Cookie', sessionB.cookie)
      .send({ currentPasswordHash, newClientSalt, newPasswordHash });
    expect(changeRes.status).toBe(204);

    expect((await request(app).get('/api/auth/me').set('Cookie', sessionA.cookie)).body.authenticated).toBe(false);
    expect((await request(app).get('/api/auth/me').set('Cookie', sessionB.cookie)).body.authenticated).toBe(true);
    await expect(signInAs(app, initialAdmin.username, 'new-secret-pass')).resolves.toMatchObject({ userId: sessionB.userId });
  });

  it('rejects unauthenticated requests to private routes with 401 (IT-04)', async () => {
    const app = createApp({ db, auth: { bcryptRounds: 4 } });
    expect((await request(app).get('/api/watchlist')).status).toBe(401);
    expect((await request(app).get('/api/lists')).status).toBe(401);
    expect((await request(app).get('/api/preferences')).status).toBe(401);
    expect((await request(app).get('/api/users')).status).toBe(401);
  });

  it('enforces DEV Mode double-lock across production and non-localhost hosts (IT-07)', async () => {
    const devApp = createApp({ db, auth: { bcryptRounds: 4, isProduction: false } });
    const usersRes = await request(devApp).get('/api/auth/dev/users').set('Host', 'localhost:3000');
    expect(usersRes.status).toBe(200);
    expect(usersRes.body.users).toHaveLength(1);
    const devLoginRes = await request(devApp)
      .post('/api/auth/dev/login')
      .set('Host', 'localhost:3000')
      .send({ userId: usersRes.body.users[0].id });
    expect(devLoginRes.status).toBe(200);

    const remoteRes = await request(devApp).get('/api/auth/dev/users').set('Host', 'app.example.com');
    expect(remoteRes.status).toBe(403);

    const prodApp = createApp({ db, auth: { bcryptRounds: 4, isProduction: true } });
    const prodRes = await request(prodApp).get('/api/auth/dev/users').set('Host', 'localhost:3000');
    expect(prodRes.status).toBe(403);
  });
});
