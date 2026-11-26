import { Router, type Request, type Response } from 'express';
import { pingDatabase, type DatabaseClient } from '../data/database';

const HTTP_OK = 200;
const HTTP_SERVICE_UNAVAILABLE = 503;

export function createHealthRouter(db: DatabaseClient): Router {
  const router = Router();
  router.get('/health', async (_req: Request, res: Response) => {
    const dbReady = await pingDatabase(db);
    const statusCode = dbReady ? HTTP_OK : HTTP_SERVICE_UNAVAILABLE;
    res.status(statusCode).json({
      status: dbReady ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      database: dbReady ? 'ok' : 'error',
    });
  });
  return router;
}
