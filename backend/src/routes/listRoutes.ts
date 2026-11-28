import { Router, type Request, type Response } from 'express';
import { validateCustomListIds } from '../services/listValidation';
import type { ListMembershipService } from '../services/listMembershipService';
import type { UserListService } from '../services/userListService';
import { AppError } from '../types/error';
import type { CreateListInput, ListEntityType, UpdateListInput } from '../types/list';
import type { WatchStatus } from '../types/watchlist';
import { requireAuth } from './authMiddleware';
import { extractRequestLocale } from './errorMiddleware';
import { parsePositiveIntParam } from './routeParams';

const VALID_STATUSES: readonly WatchStatus[] = ['want_to_watch', 'watching', 'watched'];
const VALID_LIST_FILTER_TYPES = new Set(['all', 'series', 'person']);
const HTTP_CREATED = 201;
const HTTP_NO_CONTENT = 204;

function parseTypeFilter(raw: unknown): ListEntityType | undefined {
  if (raw === undefined || raw === '' || raw === 'all') return undefined;
  if (typeof raw === 'string' && VALID_LIST_FILTER_TYPES.has(raw)) return raw as ListEntityType;
  throw new AppError('VALIDATION_ERROR', 'lists.invalidEntityType');
}

function parseOptionalPrimaryStatus(raw: unknown): WatchStatus | null {
  if (raw === undefined || raw === null || raw === '') return null;
  if (typeof raw === 'string' && VALID_STATUSES.includes(raw as WatchStatus)) return raw as WatchStatus;
  throw new AppError('VALIDATION_ERROR', 'watchlist.invalidStatus');
}

function requireListIdParam(raw: string | undefined): string {
  const trimmed = raw?.trim() ?? '';
  if (!trimmed) throw new AppError('VALIDATION_ERROR', 'common.invalidId');
  return trimmed;
}

function registerCrudRoutes(router: Router, userListService: UserListService): void {
  router.get('/lists', requireAuth, async (req: Request, res: Response) => {
    const type = parseTypeFilter(req.query.type);
    const tag = typeof req.query.tag === 'string' ? req.query.tag : undefined;
    res.json(await userListService.listAll({ userId: req.auth!.user.id, type, tag, locale: extractRequestLocale(req) }));
  });
  router.post('/lists', requireAuth, async (req: Request, res: Response) => {
    const body = (req.body ?? {}) as CreateListInput;
    res.status(HTTP_CREATED).json(
      await userListService.createCustomList({ ...body, userId: req.auth!.user.id, locale: extractRequestLocale(req) }),
    );
  });
  router.get('/lists/:listId', requireAuth, async (req: Request, res: Response) => {
    const listId = requireListIdParam(req.params.listId);
    res.json(await userListService.getDetail({ userId: req.auth!.user.id, listId, locale: extractRequestLocale(req) }));
  });
  router.patch('/lists/:listId', requireAuth, async (req: Request, res: Response) => {
    const listId = requireListIdParam(req.params.listId);
    const patch = (req.body ?? {}) as UpdateListInput & { entityType?: unknown };
    res.json(await userListService.updateList({ userId: req.auth!.user.id, listId, patch, locale: extractRequestLocale(req) }));
  });
  router.delete('/lists/:listId', requireAuth, async (req: Request, res: Response) => {
    await userListService.deleteCustomList({ userId: req.auth!.user.id, listId: requireListIdParam(req.params.listId) });
    res.status(HTTP_NO_CONTENT).send();
  });
}

function registerMembershipRoutes(router: Router, userListService: UserListService, membershipService: ListMembershipService): void {
  router.delete('/lists/:listId/items/:itemId', requireAuth, async (req: Request, res: Response) => {
    const listId = requireListIdParam(req.params.listId);
    const itemId = parsePositiveIntParam(req.params.itemId);
    await userListService.removeItemFromCustomList({ userId: req.auth!.user.id, listId, itemId });
    res.status(HTTP_NO_CONTENT).send();
  });
  router.put('/series/:seriesId/lists', requireAuth, async (req: Request, res: Response) => {
    const seriesId = parsePositiveIntParam(req.params.seriesId);
    const body = (req.body ?? {}) as Record<string, unknown>;
    const primaryStatus = parseOptionalPrimaryStatus(body.primaryStatus);
    const customListIds = validateCustomListIds(body.customListIds);
    res.json(
      await membershipService.updateSeriesLists({
        userId: req.auth!.user.id, seriesId, primaryStatus, customListIds, locale: extractRequestLocale(req),
      }),
    );
  });
  router.put('/people/:personId/lists', requireAuth, async (req: Request, res: Response) => {
    const personId = parsePositiveIntParam(req.params.personId);
    const body = (req.body ?? {}) as Record<string, unknown>;
    const customListIds = validateCustomListIds(body.customListIds);
    res.json(await membershipService.updatePersonLists({ userId: req.auth!.user.id, personId, customListIds }));
  });
}

export function createListRouter(userListService: UserListService, membershipService: ListMembershipService): Router {
  const router = Router();
  registerCrudRoutes(router, userListService);
  registerMembershipRoutes(router, userListService, membershipService);
  return router;
}
