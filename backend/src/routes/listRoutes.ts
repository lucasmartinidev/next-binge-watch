import { Router, type Request, type Response } from 'express';
import { validateCustomListIds } from '../services/listValidation';
import type { ListMembershipService } from '../services/listMembershipService';
import type { UserListService } from '../services/userListService';
import { AppError } from '../types/error';
import type { CreateListInput, ListEntityType, UpdateListInput } from '../types/list';
import type { WatchStatus } from '../types/watchlist';
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
  router.get('/lists', async (req: Request, res: Response) => {
    const type = parseTypeFilter(req.query.type);
    const tag = typeof req.query.tag === 'string' ? req.query.tag : undefined;
    res.json(await userListService.listAll({ type, tag, locale: extractRequestLocale(req) }));
  });
  router.post('/lists', async (req: Request, res: Response) => {
    const body = (req.body ?? {}) as CreateListInput;
    res.status(HTTP_CREATED).json(await userListService.createCustomList({ ...body, locale: extractRequestLocale(req) }));
  });
  router.get('/lists/:listId', async (req: Request, res: Response) => {
    const listId = requireListIdParam(req.params.listId);
    res.json(await userListService.getDetail({ listId, locale: extractRequestLocale(req) }));
  });
  router.patch('/lists/:listId', async (req: Request, res: Response) => {
    const listId = requireListIdParam(req.params.listId);
    const patch = (req.body ?? {}) as UpdateListInput & { entityType?: unknown };
    res.json(await userListService.updateList({ listId, patch, locale: extractRequestLocale(req) }));
  });
  router.delete('/lists/:listId', async (req: Request, res: Response) => {
    await userListService.deleteCustomList(requireListIdParam(req.params.listId));
    res.status(HTTP_NO_CONTENT).send();
  });
}

function registerMembershipRoutes(router: Router, userListService: UserListService, membershipService: ListMembershipService): void {
  router.delete('/lists/:listId/items/:itemId', async (req: Request, res: Response) => {
    const listId = requireListIdParam(req.params.listId);
    const itemId = parsePositiveIntParam(req.params.itemId);
    await userListService.removeItemFromCustomList({ listId, itemId });
    res.status(HTTP_NO_CONTENT).send();
  });
  router.put('/series/:seriesId/lists', async (req: Request, res: Response) => {
    const seriesId = parsePositiveIntParam(req.params.seriesId);
    const body = (req.body ?? {}) as Record<string, unknown>;
    const primaryStatus = parseOptionalPrimaryStatus(body.primaryStatus);
    const customListIds = validateCustomListIds(body.customListIds);
    res.json(await membershipService.updateSeriesLists({ seriesId, primaryStatus, customListIds, locale: extractRequestLocale(req) }));
  });
  router.put('/people/:personId/lists', async (req: Request, res: Response) => {
    const personId = parsePositiveIntParam(req.params.personId);
    const body = (req.body ?? {}) as Record<string, unknown>;
    const customListIds = validateCustomListIds(body.customListIds);
    res.json(await membershipService.updatePersonLists({ personId, customListIds }));
  });
}

export function createListRouter(userListService: UserListService, membershipService: ListMembershipService): Router {
  const router = Router();
  registerCrudRoutes(router, userListService);
  registerMembershipRoutes(router, userListService, membershipService);
  return router;
}
