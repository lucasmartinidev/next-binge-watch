import type { Request, Response } from 'express';
import { describe, expect, it, vi } from 'vitest';
import { AppError } from '../types/error';
import { requireAdmin, requireAuth, requireDevLocalhost } from './authMiddleware';

function makeReq(overrides: Partial<Request> = {}): Request {
  return {
    hostname: 'localhost',
    path: '/api/test',
    header: () => undefined,
    ...overrides,
  } as unknown as Request;
}

describe('authMiddleware (UT-09)', () => {
  it('enforces requireAuth and requireAdmin guards', () => {
    const next = vi.fn();
    expect(() => requireAuth(makeReq(), {} as Response, next)).toThrow(AppError);
    expect(() => requireAdmin(makeReq(), {} as Response, next)).toThrow(AppError);
    const userReq = makeReq({
      auth: { sessionId: 's1', user: { id: 'u1', username: 'u', email: 'u@e.com', role: 'USER', isActive: true, createdAt: '' } },
    });
    expect(() => requireAdmin(userReq, {} as Response, next)).toThrow(AppError);
    const adminReq = makeReq({
      auth: { sessionId: 's2', user: { id: 'a1', username: 'a', email: 'a@e.com', role: 'ADMIN', isActive: true, createdAt: '' } },
    });
    requireAuth(adminReq, {} as Response, next);
    requireAdmin(adminReq, {} as Response, next);
    expect(next).toHaveBeenCalledTimes(2);
  });

  it('enforces double-lock on requireDevLocalhost', () => {
    const next = vi.fn();
    const devGuard = requireDevLocalhost(false);
    const prodGuard = requireDevLocalhost(true);
    devGuard(makeReq({ hostname: 'localhost' }), {} as Response, next);
    expect(next).toHaveBeenCalledTimes(1);
    expect(() => prodGuard(makeReq({ hostname: 'localhost' }), {} as Response, next)).toThrow(AppError);
    expect(() => devGuard(makeReq({ hostname: 'example.com' }), {} as Response, next)).toThrow(AppError);
    expect(() =>
      devGuard(makeReq({ hostname: 'localhost', header: (() => 'https://evil.example.com') as never }), {} as Response, next),
    ).toThrow(AppError);
  });
});
