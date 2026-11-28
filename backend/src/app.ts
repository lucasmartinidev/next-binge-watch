import cors from 'cors';
import express, { type Express, type Router } from 'express';
import type { DatabaseClient } from './data/database';
import { registerApiRouters } from './registerApiRouters';
import { errorMiddleware } from './routes/errorMiddleware';

export type AppAuthOptions = {
  sessionTtlDays?: number;
  saltPepper?: string;
  corsOrigins?: string[];
  isProduction?: boolean;
  bcryptRounds?: number;
};

export type AppDependencies = {
  db: DatabaseClient;
  tvmazeBaseUrl?: string;
  tvmazeTimeoutMs?: number;
  fetchFn?: typeof fetch;
  extraRouters?: Router[];
  auth?: AppAuthOptions;
};

function createCorsMiddleware(allowedOrigins: string[], isProduction: boolean) {
  const allowed = new Set(allowedOrigins);
  return cors({
    credentials: true,
    origin(origin, callback) {
      if (!origin || allowed.has(origin)) return callback(null, true);
      if (!isProduction && /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) return callback(null, true);
      callback(null, false);
    },
  });
}

export function createApp(dependencies: AppDependencies): Express {
  const app = express();
  app.use(createCorsMiddleware(dependencies.auth?.corsOrigins ?? ['http://localhost:5173'], dependencies.auth?.isProduction ?? false));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  registerApiRouters(app, dependencies);
  for (const router of dependencies.extraRouters ?? []) app.use('/api', router);
  app.use(errorMiddleware);
  return app;
}
