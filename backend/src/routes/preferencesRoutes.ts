import { Router, type Request, type Response } from 'express';
import type { PreferencesService } from '../services/preferencesService';
import { AppError } from '../types/error';
import { SUPPORTED_LOCALES, type Locale } from '../types/locale';
import { requireAuth } from './authMiddleware';

function parseStrictLocale(raw: unknown): Locale {
  if (typeof raw === 'string' && SUPPORTED_LOCALES.includes(raw as Locale)) {
    return raw as Locale;
  }
  throw new AppError('VALIDATION_ERROR', 'preferences.invalidLocale');
}

export function createPreferencesRouter(preferencesService: PreferencesService): Router {
  const router = Router();
  router.use('/preferences', requireAuth);
  router.get('/preferences', async (req: Request, res: Response) => {
    res.json(await preferencesService.getPreferences(req.auth!.user.id));
  });
  router.put('/preferences', async (req: Request, res: Response) => {
    const body = req.body as Record<string, unknown>;
    const locale = parseStrictLocale(body?.locale);
    res.json(await preferencesService.updatePreferences({ userId: req.auth!.user.id, locale }));
  });
  return router;
}
