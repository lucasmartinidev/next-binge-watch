import { Router, type Request, type Response } from 'express';
import type { AuthService } from '../services/authService';
import { clearSessionCookie, setSessionCookie } from './authCookies';
import { requireAuth, requireDevLocalhost } from './authMiddleware';

const SECONDS_PER_DAY = 86_400;
const HTTP_NO_CONTENT = 204;

export type AuthRouterOptions = {
  authService: AuthService;
  sessionTtlDays: number;
  isProduction: boolean;
};

function readBody(req: Request): Record<string, unknown> {
  return (req.body ?? {}) as Record<string, unknown>;
}

function registerSessionRoutes(router: Router, options: AuthRouterOptions): void {
  const maxAgeSeconds = options.sessionTtlDays * SECONDS_PER_DAY;
  router.post('/auth/challenge', async (req: Request, res: Response) => {
    const body = readBody(req);
    res.json(await options.authService.issueChallenge(String(body.identifier ?? '')));
  });
  router.post('/auth/login', async (req: Request, res: Response) => {
    const body = readBody(req);
    const result = await options.authService.login({
      identifier: String(body.identifier ?? ''),
      passwordHash: String(body.passwordHash ?? ''),
    });
    setSessionCookie(res, { token: result.sessionToken, maxAgeSeconds, isProduction: options.isProduction });
    res.json({ user: result.user });
  });
  router.post('/auth/logout', async (req: Request, res: Response) => {
    await options.authService.logout(req.auth?.sessionId ?? null);
    clearSessionCookie(res, options.isProduction);
    res.status(HTTP_NO_CONTENT).send();
  });
  router.get('/auth/me', (req: Request, res: Response) => {
    res.json({ authenticated: Boolean(req.auth), user: req.auth?.user ?? null });
  });
}

function registerAccountAndDevRoutes(router: Router, options: AuthRouterOptions): void {
  const maxAgeSeconds = options.sessionTtlDays * SECONDS_PER_DAY;
  const devGuard = requireDevLocalhost(options.isProduction);
  router.get('/auth/password-challenge', requireAuth, async (req: Request, res: Response) => {
    res.json(await options.authService.getPasswordChallenge(req.auth!.user.id));
  });
  router.post('/auth/change-password', requireAuth, async (req: Request, res: Response) => {
    const body = readBody(req);
    await options.authService.changePassword({
      userId: req.auth!.user.id,
      sessionId: req.auth!.sessionId,
      currentPasswordHash: String(body.currentPasswordHash ?? ''),
      newClientSalt: String(body.newClientSalt ?? ''),
      newPasswordHash: String(body.newPasswordHash ?? ''),
    });
    res.status(HTTP_NO_CONTENT).send();
  });
  router.get('/auth/dev/users', devGuard, async (_req: Request, res: Response) => {
    res.json({ users: await options.authService.listDevUsers() });
  });
  router.post('/auth/dev/login', devGuard, async (req: Request, res: Response) => {
    const result = await options.authService.loginAsDevUser(String(readBody(req).userId ?? ''));
    setSessionCookie(res, { token: result.sessionToken, maxAgeSeconds, isProduction: options.isProduction });
    res.json({ user: result.user });
  });
}

export function createAuthRouter(options: AuthRouterOptions): Router {
  const router = Router();
  registerSessionRoutes(router, options);
  registerAccountAndDevRoutes(router, options);
  return router;
}
