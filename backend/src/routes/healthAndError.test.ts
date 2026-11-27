import { Router } from 'express';
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createApp } from '../app';
import { closeDatabase, type DatabaseClient } from '../data/database';
import { openTestDatabase } from '../data/testDatabase';
import { AppError } from '../types/error';

describe('Health and errorMiddleware integration (IT-05)', () => {
  let db: DatabaseClient;
  let closedInTest = false;

  beforeEach(async () => {
    closedInTest = false;
    db = await openTestDatabase();
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    if (!closedInTest) {
      await closeDatabase(db);
    }
  });

  it('GET /health returns 200 healthy when database is operational', async () => {
    const app = createApp({ db });
    const response = await request(app).get('/health');
    expect(response.status).toBe(200);
    expect(response.body.status).toBe('healthy');
    expect(response.body.database).toBe('ok');
    expect(typeof response.body.timestamp).toBe('string');
  });

  it('GET /health returns 503 unhealthy when database check fails', async () => {
    closedInTest = true;
    await closeDatabase(db);
    const app = createApp({ db });
    const response = await request(app).get('/health');
    expect(response.status).toBe(503);
    expect(response.body.status).toBe('unhealthy');
    expect(response.body.database).toBe('error');
  });

  it('maps AppError codes (429, 504, 502) and unexpected errors to localized responses', async () => {
    const testRouter = Router();
    testRouter.get('/test-rate-limit', () => {
      throw new AppError('UPSTREAM_RATE_LIMITED', 'upstream.rateLimited');
    });
    testRouter.get('/test-timeout', () => {
      throw new AppError('UPSTREAM_TIMEOUT', 'upstream.timeout');
    });
    testRouter.get('/test-unavailable', () => {
      throw new AppError('UPSTREAM_UNAVAILABLE', 'upstream.unavailable');
    });
    testRouter.get('/test-crash', () => {
      throw new Error('Unexpected crash');
    });
    const app = createApp({ db, extraRouters: [testRouter] });
    const rateLimitRes = await request(app).get('/api/test-rate-limit?lang=pt-BR');
    expect(rateLimitRes.status).toBe(429);
    expect(rateLimitRes.body).toEqual({
      error: {
        code: 'UPSTREAM_RATE_LIMITED',
        message: 'O catálogo está temporariamente sobrecarregado. Tente novamente em alguns segundos.',
      },
    });
    const timeoutRes = await request(app).get('/api/test-timeout?lang=en');
    expect(timeoutRes.status).toBe(504);
    expect(timeoutRes.body.error.code).toBe('UPSTREAM_TIMEOUT');
    const unavailableRes = await request(app).get('/api/test-unavailable?lang=en');
    expect(unavailableRes.status).toBe(502);
    expect(unavailableRes.body.error.code).toBe('UPSTREAM_UNAVAILABLE');
    const crashRes = await request(app).get('/api/test-crash?lang=pt-BR');
    expect(crashRes.status).toBe(500);
    expect(crashRes.body).toEqual({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Ocorreu um erro inesperado.',
      },
    });
  });
});
