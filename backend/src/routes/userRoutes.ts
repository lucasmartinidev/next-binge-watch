import { Router, type Request, type Response } from 'express';
import type { UserManagementService } from '../services/userManagementService';
import type { UserRole } from '../types/auth';
import { requireAdmin, requireAuth } from './authMiddleware';

const HTTP_CREATED = 201;
const HTTP_NO_CONTENT = 204;

function parseCreateBody(req: Request) {
  const body = (req.body ?? {}) as Record<string, unknown>;
  return {
    username: String(body.username ?? ''),
    email: String(body.email ?? ''),
    role: body.role as UserRole,
    clientSalt: String(body.clientSalt ?? ''),
    passwordHash: String(body.passwordHash ?? ''),
  };
}

function parseUpdateBody(req: Request) {
  const body = (req.body ?? {}) as Record<string, unknown>;
  return {
    actorUserId: req.auth!.user.id,
    targetUserId: req.params.userId ?? '',
    role: body.role as UserRole | undefined,
    isActive: body.isActive as boolean | undefined,
  };
}

export function createUserRouter(userService: UserManagementService): Router {
  const router = Router();
  router.use('/users', requireAuth, requireAdmin);
  router.get('/users', async (_req: Request, res: Response) => {
    res.json({ users: await userService.listUsers() });
  });
  router.post('/users', async (req: Request, res: Response) => {
    const user = await userService.createUser(parseCreateBody(req));
    res.status(HTTP_CREATED).json({ user });
  });
  router.patch('/users/:userId', async (req: Request, res: Response) => {
    const user = await userService.updateUser(parseUpdateBody(req));
    res.json({ user });
  });
  router.delete('/users/:userId', async (req: Request, res: Response) => {
    await userService.deleteUser({ actorUserId: req.auth!.user.id, targetUserId: req.params.userId ?? '' });
    res.status(HTTP_NO_CONTENT).send();
  });
  return router;
}
