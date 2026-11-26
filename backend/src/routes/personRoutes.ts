import { Router, type Request, type Response } from 'express';
import type { PersonService } from '../services/personService';
import { parsePositiveIntParam } from './routeParams';

export function createPersonRouter(personService: PersonService): Router {
  const router = Router();
  router.get('/people/:id', async (req: Request, res: Response) => {
    const id = parsePositiveIntParam(req.params.id);
    const profile = await personService.getPersonProfile(id);
    res.json(profile);
  });
  return router;
}
