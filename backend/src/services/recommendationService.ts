import { logger } from '../config/logger';
import type { TvmazeClient } from '../data/tvmazeClient';
import type { WatchedEpisodeRepository } from '../data/watchedEpisodeRepository';
import type { StoredWatchlistRow, WatchlistRepository } from '../data/watchlistRepository';
import type { Locale } from '../types/locale';
import type { NextBingeRecommendation, NextBingeResponse } from '../types/recommendation';
import { stripHtml } from './htmlSanitizer';
import { extractPreferredGenres, rankDiscoveryShows } from './recommendationDiscovery';
import { buildWantToWatchPicks, toWatchingPick } from './recommendationPicks';
import { findNextEpisode } from './watchlistMapper';

type RecommendationContext = {
  saved: StoredWatchlistRow[];
  excludeSet: Set<number>;
  locale: Locale;
};

export class RecommendationService {
  constructor(
    private readonly tvmaze: TvmazeClient,
    private readonly watchlistRepo: WatchlistRepository,
    private readonly watchedEpisodeRepo: WatchedEpisodeRepository,
  ) {}

  async getNextBinge(input: { locale: Locale; excludeIds: number[] }): Promise<NextBingeResponse> {
    const saved = await this.watchlistRepo.listAll();
    const context: RecommendationContext = { saved, excludeSet: new Set(input.excludeIds), locale: input.locale };
    const watchlistPicks = [
      ...(await this.buildWatchingPicks(context)),
      ...buildWantToWatchPicks(saved, context.excludeSet, input.locale),
    ];
    const discoveryPicks = await this.loadDiscoveryPicks(context, watchlistPicks.length > 0);
    const candidates = [...watchlistPicks, ...discoveryPicks];
    return { locale: input.locale, recommendation: candidates[0] ?? null, hasMore: candidates.length > 1 };
  }

  private async buildWatchingPicks(context: RecommendationContext): Promise<NextBingeRecommendation[]> {
    const watching = context.saved.filter((row) => row.status === 'watching' && !context.excludeSet.has(row.seriesId));
    const picks: NextBingeRecommendation[] = [];
    for (const row of watching) {
      const pick = await this.buildWatchingPick(row, context.locale);
      if (pick) {
        picks.push(pick);
      }
    }
    return picks;
  }

  private async buildWatchingPick(row: StoredWatchlistRow, locale: Locale): Promise<NextBingeRecommendation | null> {
    const show = await this.tvmaze.getShowWithEmbeds(row.seriesId).catch(() => null);
    if (!show) {
      return null;
    }
    const watchedRows = await this.watchedEpisodeRepo.listBySeriesId(row.seriesId);
    const watchedIds = new Set(watchedRows.map((watchedRow) => watchedRow.episodeId));
    const nextEpisode = findNextEpisode(show._embedded?.episodes ?? [], watchedIds);
    return nextEpisode ? toWatchingPick({ row, summary: stripHtml(show.summary), nextEpisode, locale }) : null;
  }

  private async loadDiscoveryPicks(
    context: RecommendationContext,
    hasFallback: boolean,
  ): Promise<NextBingeRecommendation[]> {
    try {
      const catalog = await this.tvmaze.getShowsPage(0);
      return rankDiscoveryShows({
        catalog,
        trackedIds: new Set(context.saved.map((row) => row.seriesId)),
        excludeSet: context.excludeSet,
        preferredGenres: extractPreferredGenres(context.saved),
        locale: context.locale,
      });
    } catch (error: unknown) {
      if (!hasFallback) {
        throw error;
      }
      logger.warn('Discovery catalog unavailable; serving watchlist picks only', { error: String(error) });
      return [];
    }
  }
}
