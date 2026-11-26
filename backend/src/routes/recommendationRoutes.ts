import { Router, type Request, type Response } from 'express';
import type { RecommendationService } from '../services/recommendationService';
import { AppError } from '../types/error';
import { extractRequestLocale } from './errorMiddleware';

function parseExcludeIds(raw: unknown): number[] {
  if (raw === undefined || raw === '') {
    return [];
  }
  if (typeof raw !== 'string') {
    throw new AppError('VALIDATION_ERROR', 'recommendations.invalidExcludeIds');
  }
  const parts = raw.split(',').map((part) => part.trim()).filter(Boolean);
  const ids: number[] = [];
  for (const part of parts) {
    if (!/^\d+$/.test(part) || Number(part) <= 0) {
      throw new AppError('VALIDATION_ERROR', 'recommendations.invalidExcludeIds');
    }
    ids.push(Number(part));
  }
  return ids;
}

export function createRecommendationRouter(recommendationService: RecommendationService): Router {
  const router = Router();
  router.get('/recommendations/next-binge', async (req: Request, res: Response) => {
    const locale = extractRequestLocale(req);
    const excludeIds = parseExcludeIds(req.query.excludeIds);
    res.json(await recommendationService.getNextBinge({ locale, excludeIds }));
  });
  return router;
}
