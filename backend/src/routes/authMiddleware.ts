import type { NextFunction, Request, RequestHandler, Response } from 'express';
import { logger } from '../config/logger';
import type { AuthService } from '../services/authService';
import type { ActiveSessionContext } from '../types/auth';
import { AppError } from '../types/error';
import { parseSessionCookie } from './authCookies';

declare module 'express-serve-static-core' {
  interface Request {
    auth?: ActiveSessionContext;
  }
}

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '::1', '::ffff:127.0.0.1']);

function isLocalOriginHeader(origin: string | undefined): boolean {
  if (!origin) return true;
  try {
    return LOCAL_HOSTS.has(new URL(origin).hostname.toLowerCase());
  } catch {
    return false;
  }
}

export function isLocalhostRequest(req: Request): boolean {
  const hostname = (req.hostname ?? '').toLowerCase();
  return LOCAL_HOSTS.has(hostname) && isLocalOriginHeader(req.header('origin'));
}

export function attachOptionalAuth(authService: AuthService): RequestHandler {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    const token = parseSessionCookie(req);
    if (!token) {
      next();
      return;
    }
    req.auth = (await authService.getSessionByToken(token)) ?? undefined;
    next();
  };
}

export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  if (!req.auth) {
    throw new AppError('UNAUTHORIZED', 'auth.unauthorized');
  }
  next();
}

export function requireAdmin(req: Request, _res: Response, next: NextFunction): void {
  if (!req.auth) {
    throw new AppError('UNAUTHORIZED', 'auth.unauthorized');
  }
  if (req.auth.user.role !== 'ADMIN') {
    logger.warn('Forbidden admin route access', { userId: req.auth.user.id, route: req.path });
    throw new AppError('FORBIDDEN', 'auth.forbidden');
  }
  next();
}

export function requireDevLocalhost(isProduction: boolean): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (isProduction || !isLocalhostRequest(req)) {
      logger.warn('Blocked DEV auth request outside localhost', { route: req.path, hostname: req.hostname });
      throw new AppError('FORBIDDEN', 'auth.devModeDisabled');
    }
    next();
  };
}
