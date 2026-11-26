import { Router, type Request, type Response } from 'express';
import type { SearchService } from '../services/searchService';
import { AppError } from '../types/error';
import type { SearchScope } from '../types/search';
import { extractRequestLocale } from './errorMiddleware';

const MAX_QUERY_LENGTH = 100;
const VALID_SCOPES: readonly SearchScope[] = ['all', 'series', 'person'];

function parseSearchQuery(raw: unknown): string {
  const query = typeof raw === 'string' ? raw.trim() : '';
  if (query.length === 0) {
    throw new AppError('VALIDATION_ERROR', 'search.queryRequired');
  }
  if (query.length > MAX_QUERY_LENGTH) {
    throw new AppError('VALIDATION_ERROR', 'search.queryTooLong');
  }
  return query;
}

function parseSearchType(raw: unknown): SearchScope {
  if (raw === undefined || raw === '') {
    return 'all';
  }
  if (typeof raw === 'string' && VALID_SCOPES.includes(raw as SearchScope)) {
    return raw as SearchScope;
  }
  throw new AppError('VALIDATION_ERROR', 'search.invalidType');
}

export function createSearchRouter(searchService: SearchService): Router {
  const router = Router();
  router.get('/search', async (req: Request, res: Response) => {
    const query = parseSearchQuery(req.query.q);
    const type = parseSearchType(req.query.type);
    const locale = extractRequestLocale(req);
    const result = await searchService.search({ query, type, locale });
    res.json(result);
  });
  return router;
}
