import { Router, type Request, type Response } from 'express';
import type { SeriesService } from '../services/seriesService';
import { extractRequestLocale } from './errorMiddleware';
import { parsePositiveIntParam } from './routeParams';

export function createSeriesRouter(seriesService: SeriesService): Router {
  const router = Router();
  router.get('/series/:id', async (req: Request, res: Response) => {
    const id = parsePositiveIntParam(req.params.id);
    const locale = extractRequestLocale(req);
    const profile = await seriesService.getSeriesProfile({ id, locale, userId: req.auth?.user.id });
    res.json(profile);
  });
  return router;
}
