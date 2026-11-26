import express, { type Express, type Router } from 'express';
import cors from 'cors';
import type { DatabaseClient } from './data/database';
import { PreferencesRepository } from './data/preferencesRepository';
import { TtlCache } from './data/ttlCache';
import { TvmazeClient } from './data/tvmazeClient';
import { WatchedEpisodeRepository } from './data/watchedEpisodeRepository';
import { WatchlistRepository } from './data/watchlistRepository';
import { EpisodeTrackingService } from './services/episodeTrackingService';
import { PersonService } from './services/personService';
import { PreferencesService } from './services/preferencesService';
import { RecommendationService } from './services/recommendationService';
import { SearchService } from './services/searchService';
import { SeriesService } from './services/seriesService';
import { WatchlistService } from './services/watchlistService';
import { errorMiddleware } from './routes/errorMiddleware';
import { createHealthRouter } from './routes/healthRoutes';
import { createPersonRouter } from './routes/personRoutes';
import { createPreferencesRouter } from './routes/preferencesRoutes';
import { createRecommendationRouter } from './routes/recommendationRoutes';
import { createSearchRouter } from './routes/searchRoutes';
import { createSeriesRouter } from './routes/seriesRoutes';
import { createWatchlistRouter } from './routes/watchlistRoutes';

export type AppDependencies = {
  db: DatabaseClient;
  tvmazeBaseUrl?: string;
  tvmazeTimeoutMs?: number;
  fetchFn?: typeof fetch;
  extraRouters?: Router[];
};

const DEFAULT_TVMAZE_URL = 'https://api.tvmaze.com';
const DEFAULT_TIMEOUT_MS = 5000;

export function createApp(dependencies: AppDependencies): Express {
  const app = express();
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  const tvmazeClient = new TvmazeClient({
    baseUrl: dependencies.tvmazeBaseUrl ?? DEFAULT_TVMAZE_URL,
    timeoutMs: dependencies.tvmazeTimeoutMs ?? DEFAULT_TIMEOUT_MS,
    cache: new TtlCache(),
    fetchFn: dependencies.fetchFn,
  });
  const watchlistRepo = new WatchlistRepository(dependencies.db);
  const watchedEpisodeRepo = new WatchedEpisodeRepository(dependencies.db);
  const preferencesRepo = new PreferencesRepository(dependencies.db);
  const watchlistService = new WatchlistService(tvmazeClient, watchlistRepo, watchedEpisodeRepo);
  const episodeService = new EpisodeTrackingService(tvmazeClient, watchlistRepo, watchedEpisodeRepo);
  const recommendationService = new RecommendationService(tvmazeClient, watchlistRepo, watchedEpisodeRepo);
  app.use(createHealthRouter(dependencies.db));
  app.use('/api', createSearchRouter(new SearchService(tvmazeClient, watchlistRepo)));
  app.use('/api', createSeriesRouter(new SeriesService(tvmazeClient, watchlistRepo, watchedEpisodeRepo)));
  app.use('/api', createPersonRouter(new PersonService(tvmazeClient)));
  app.use('/api', createWatchlistRouter(watchlistService, episodeService));
  app.use('/api', createRecommendationRouter(recommendationService));
  app.use('/api', createPreferencesRouter(new PreferencesService(preferencesRepo)));
  for (const router of dependencies.extraRouters ?? []) {
    app.use('/api', router);
  }
  app.use(errorMiddleware);
  return app;
}
