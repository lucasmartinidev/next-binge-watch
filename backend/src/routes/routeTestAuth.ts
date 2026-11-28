import bcrypt from 'bcryptjs';
import type { Express } from 'express';
import request from 'supertest';
import { loadAuthConfig } from '../config/authConfig';

export async function signInAs(
  app: Express,
  identifier: string,
  password: string,
): Promise<{ cookie: string; userId: string }> {
  const challenge = await request(app).post('/api/auth/challenge').send({ identifier });
  const passwordHash = await bcrypt.hash(password, challenge.body.salt as string);
  const loginRes = await request(app).post('/api/auth/login').send({ identifier, passwordHash });
  const cookie = (loginRes.headers['set-cookie']?.[0] ?? '').split(';')[0];
  return { cookie, userId: String(loginRes.body.user.id) };
}

export async function signInAsAdmin(app: Express): Promise<{ cookie: string; userId: string }> {
  const { initialAdmin } = loadAuthConfig();
  return signInAs(app, initialAdmin.username, initialAdmin.password);
}
