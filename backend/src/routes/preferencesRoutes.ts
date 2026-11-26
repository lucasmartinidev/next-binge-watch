import { Router, type Request, type Response } from 'express';
import type { PreferencesService } from '../services/preferencesService';
import { AppError } from '../types/error';
import { SUPPORTED_LOCALES, type Locale } from '../types/locale';

function parseStrictLocale(raw: unknown): Locale {
  if (typeof raw === 'string' && SUPPORTED_LOCALES.includes(raw as Locale)) {
    return raw as Locale;
  }
  throw new AppError('VALIDATION_ERROR', 'preferences.invalidLocale');
}

export function createPreferencesRouter(preferencesService: PreferencesService): Router {
  const router = Router();
  router.get('/preferences', async (_req: Request, res: Response) => {
    res.json(await preferencesService.getPreferences());
  });
  router.put('/preferences', async (req: Request, res: Response) => {
    const body = req.body as Record<string, unknown>;
    const locale = parseStrictLocale(body?.locale);
    res.json(await preferencesService.updatePreferences({ locale }));
  });
  return router;
}
