import cors from 'cors';
import express, { type Express, type Router } from 'express';
import type { DatabaseClient } from './data/database';
import { ListMembershipRepository } from './data/listMembershipRepository';
import { PreferencesRepository } from './data/preferencesRepository';
import { TtlCache } from './data/ttlCache';
import { TvmazeClient } from './data/tvmazeClient';
import { UserListRepository } from './data/userListRepository';
import { WatchedEpisodeRepository } from './data/watchedEpisodeRepository';
import { WatchlistRepository } from './data/watchlistRepository';
import { errorMiddleware } from './routes/errorMiddleware';
import { createHealthRouter } from './routes/healthRoutes';
import { createListRouter } from './routes/listRoutes';
import { createPersonRouter } from './routes/personRoutes';
import { createPreferencesRouter } from './routes/preferencesRoutes';
import { createRecommendationRouter } from './routes/recommendationRoutes';
import { createSearchRouter } from './routes/searchRoutes';
import { createSeriesRouter } from './routes/seriesRoutes';
import { createWatchlistRouter } from './routes/watchlistRoutes';
import { EpisodeTrackingService } from './services/episodeTrackingService';
import { ListMembershipService } from './services/listMembershipService';
import { PersonService } from './services/personService';
import { PreferencesService } from './services/preferencesService';
import { RecommendationService } from './services/recommendationService';
import { SearchService } from './services/searchService';
import { SeriesService } from './services/seriesService';
import { UserListService } from './services/userListService';
import { WatchlistService } from './services/watchlistService';

export type AppDependencies = { db: DatabaseClient; tvmazeBaseUrl?: string; tvmazeTimeoutMs?: number; fetchFn?: typeof fetch; extraRouters?: Router[] };

const DEFAULT_TVMAZE_URL = 'https://api.tvmaze.com';
const DEFAULT_TIMEOUT_MS = 5000;

function registerApiRouters(app: Express, deps: AppDependencies): void {
  const tvmazeClient = new TvmazeClient({
    baseUrl: deps.tvmazeBaseUrl ?? DEFAULT_TVMAZE_URL,
    timeoutMs: deps.tvmazeTimeoutMs ?? DEFAULT_TIMEOUT_MS,
    cache: new TtlCache(),
    fetchFn: deps.fetchFn,
  });
  const watchlistRepo = new WatchlistRepository(deps.db);
  const watchedEpisodeRepo = new WatchedEpisodeRepository(deps.db);
  const preferencesRepo = new PreferencesRepository(deps.db);
  const userListRepo = new UserListRepository(deps.db);
  const membershipRepo = new ListMembershipRepository(deps.db);
  const membershipService = new ListMembershipService({ userListRepo, membershipRepo, watchlistRepo, watchedEpisodeRepo, tvmaze: tvmazeClient });
  const watchlistService = new WatchlistService(tvmazeClient, watchlistRepo, watchedEpisodeRepo).withMembershipService(membershipService);
  const userListService = new UserListService({ userListRepo, membershipRepo, watchlistService, watchedEpisodeRepo, tvmaze: tvmazeClient, membershipService });
  app.use(createHealthRouter(deps.db));
  app.use('/api', createSearchRouter(new SearchService(tvmazeClient, watchlistRepo, membershipService)));
  app.use('/api', createSeriesRouter(new SeriesService(tvmazeClient, watchlistRepo, watchedEpisodeRepo).withMembershipService(membershipService)));
  app.use('/api', createPersonRouter(new PersonService(tvmazeClient, membershipService)));
  app.use('/api', createWatchlistRouter(watchlistService, new EpisodeTrackingService(tvmazeClient, watchlistRepo, watchedEpisodeRepo)));
  app.use('/api', createListRouter(userListService, membershipService));
  app.use('/api', createRecommendationRouter(new RecommendationService(tvmazeClient, watchlistRepo, watchedEpisodeRepo).withMembershipService(membershipService)));
  app.use('/api', createPreferencesRouter(new PreferencesService(preferencesRepo)));
}

export function createApp(dependencies: AppDependencies): Express {
  const app = express();
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  registerApiRouters(app, dependencies);
  for (const router of dependencies.extraRouters ?? []) app.use('/api', router);
  app.use(errorMiddleware);
  return app;
}
