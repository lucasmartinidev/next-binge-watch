import { Router, type Request, type Response } from 'express';
import type { EpisodeTrackingService } from '../services/episodeTrackingService';
import type { WatchlistService } from '../services/watchlistService';
import { AppError } from '../types/error';
import type { WatchStatus } from '../types/watchlist';
import { requireAuth } from './authMiddleware';
import { extractRequestLocale } from './errorMiddleware';
import { parseNonNegativeIntParam, parsePositiveIntParam } from './routeParams';

const VALID_STATUSES: readonly WatchStatus[] = ['want_to_watch', 'watching', 'watched'];
const ALL_STATUSES_FILTER = 'all';
const HTTP_CREATED = 201;
const HTTP_NO_CONTENT = 204;

function parseWatchStatus(raw: unknown): WatchStatus {
  if (typeof raw === 'string' && VALID_STATUSES.includes(raw as WatchStatus)) return raw as WatchStatus;
  throw new AppError('VALIDATION_ERROR', 'watchlist.invalidStatus');
}

function parseStatusFilter(raw: unknown): WatchStatus | undefined {
  if (typeof raw !== 'string' || raw === ALL_STATUSES_FILTER) return undefined;
  return parseWatchStatus(raw);
}

function parseWatchedFlag(raw: unknown): boolean {
  if (typeof raw !== 'boolean') throw new AppError('VALIDATION_ERROR', 'watchlist.invalidWatchedFlag');
  return raw;
}

function readBody(req: Request): Record<string, unknown> {
  return (req.body ?? {}) as Record<string, unknown>;
}

function registerCrudRoutes(router: Router, service: WatchlistService): void {
  router.get('/watchlist', async (req: Request, res: Response) => {
    const status = parseStatusFilter(req.query.status);
    res.json(await service.list({ userId: req.auth!.user.id, status, locale: extractRequestLocale(req) }));
  });
  router.post('/watchlist', async (req: Request, res: Response) => {
    const body = readBody(req);
    const seriesId = parsePositiveIntParam(typeof body.seriesId === 'number' ? String(body.seriesId) : undefined);
    const status = parseWatchStatus(body.status ?? 'want_to_watch');
    res.status(HTTP_CREATED).json(await service.addSeries({ userId: req.auth!.user.id, seriesId, status, locale: extractRequestLocale(req) }));
  });
  router.patch('/watchlist/:seriesId', async (req: Request, res: Response) => {
    const seriesId = parsePositiveIntParam(req.params.seriesId);
    const status = parseWatchStatus(readBody(req).status);
    res.json(await service.updateStatus({ userId: req.auth!.user.id, seriesId, status, locale: extractRequestLocale(req) }));
  });
  router.delete('/watchlist/:seriesId', async (req: Request, res: Response) => {
    await service.removeSeries({ userId: req.auth!.user.id, seriesId: parsePositiveIntParam(req.params.seriesId) });
    res.status(HTTP_NO_CONTENT).send();
  });
}

function registerEpisodeRoutes(router: Router, service: EpisodeTrackingService): void {
  router.put('/watchlist/:seriesId/episodes/:episodeId', async (req: Request, res: Response) => {
    const seriesId = parsePositiveIntParam(req.params.seriesId);
    const episodeId = parsePositiveIntParam(req.params.episodeId, 'watchlist.invalidEpisodeId');
    const watched = parseWatchedFlag(readBody(req).watched);
    res.json(await service.toggleEpisode({ userId: req.auth!.user.id, seriesId, episodeId, watched }));
  });
  router.put('/watchlist/:seriesId/seasons/:seasonNumber', async (req: Request, res: Response) => {
    const seriesId = parsePositiveIntParam(req.params.seriesId);
    const seasonNumber = parseNonNegativeIntParam(req.params.seasonNumber, 'watchlist.invalidSeasonNumber');
    const watched = parseWatchedFlag(readBody(req).watched);
    res.json(await service.toggleSeason({ userId: req.auth!.user.id, seriesId, seasonNumber, watched }));
  });
}

export function createWatchlistRouter(
  watchlistService: WatchlistService,
  episodeTrackingService: EpisodeTrackingService,
): Router {
  const router = Router();
  router.use('/watchlist', requireAuth);
  registerCrudRoutes(router, watchlistService);
  registerEpisodeRoutes(router, episodeTrackingService);
  return router;
}
