import { Router, type Request, type Response } from 'express';
import type { PersonService } from '../services/personService';
import { extractRequestLocale } from './errorMiddleware';
import { parsePositiveIntParam } from './routeParams';

export function createPersonRouter(personService: PersonService): Router {
  const router = Router();
  router.get('/people/:id', async (req: Request, res: Response) => {
    const id = parsePositiveIntParam(req.params.id);
    const profile = await personService.getPersonProfile(id, extractRequestLocale(req), req.auth?.user.id);
    res.json(profile);
  });
  return router;
}
