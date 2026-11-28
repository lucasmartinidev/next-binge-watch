import { logger } from '../config/logger';
import type { TvmazeClient } from '../data/tvmazeClient';
import type { WatchedEpisodeRepository } from '../data/watchedEpisodeRepository';
import type { StoredWatchlistRow, WatchlistRepository } from '../data/watchlistRepository';
import type { Locale } from '../types/locale';
import type { NextBingeRecommendation, NextBingeResponse } from '../types/recommendation';
import { stripHtml } from './htmlSanitizer';
import type { ListMembershipService } from './listMembershipService';
import { extractPreferredGenres, rankDiscoveryShows } from './recommendationDiscovery';
import { buildWantToWatchPicks, toWatchingPick } from './recommendationPicks';
import { findNextEpisode } from './watchlistMapper';

type RecommendationContext = {
  userId?: string;
  saved: StoredWatchlistRow[];
  excludeSet: Set<number>;
  locale: Locale;
};

export class RecommendationService {
  private membershipService?: ListMembershipService;

  constructor(
    private readonly tvmaze: TvmazeClient,
    private readonly watchlistRepo: WatchlistRepository,
    private readonly watchedEpisodeRepo: WatchedEpisodeRepository,
  ) {}

  withMembershipService(service: ListMembershipService): this {
    this.membershipService = service;
    return this;
  }

  async getNextBinge(input: { locale: Locale; excludeIds: number[]; userId?: string }): Promise<NextBingeResponse> {
    const saved = input.userId ? await this.watchlistRepo.listAll(input.userId) : [];
    const context: RecommendationContext = { userId: input.userId, saved, excludeSet: new Set(input.excludeIds), locale: input.locale };
    const watchlistPicks = input.userId
      ? [...(await this.buildWatchingPicks(context)), ...buildWantToWatchPicks(saved, context.excludeSet, input.locale)]
      : [];
    const discoveryPicks = await this.loadDiscoveryPicks(context, watchlistPicks.length > 0);
    const candidates = [...watchlistPicks, ...discoveryPicks];
    const top = candidates[0] ?? null;
    const recommendation = top ? await this.attachBadges(top, input.locale, input.userId) : null;
    return { locale: input.locale, recommendation, hasMore: candidates.length > 1 };
  }

  private async attachBadges(pick: NextBingeRecommendation, locale: Locale, userId?: string): Promise<NextBingeRecommendation> {
    if (!this.membershipService || !userId) return pick;
    const badgesMap = await this.membershipService.getSeriesBadgesMap(userId, [pick.seriesId], locale);
    return { ...pick, lists: badgesMap.get(pick.seriesId) ?? [] };
  }

  private async buildWatchingPicks(context: RecommendationContext): Promise<NextBingeRecommendation[]> {
    const watching = context.saved.filter((row) => row.status === 'watching' && !context.excludeSet.has(row.seriesId));
    const picks: NextBingeRecommendation[] = [];
    for (const row of watching) {
      const pick = await this.buildWatchingPick(row, context.locale, context.userId!);
      if (pick) picks.push(pick);
    }
    return picks;
  }

  private async buildWatchingPick(row: StoredWatchlistRow, locale: Locale, userId: string): Promise<NextBingeRecommendation | null> {
    const show = await this.tvmaze.getShowWithEmbeds(row.seriesId).catch(() => null);
    if (!show) return null;
    const watchedRows = await this.watchedEpisodeRepo.listBySeriesId(userId, row.seriesId);
    const watchedIds = new Set(watchedRows.map((watchedRow) => watchedRow.episodeId));
    const nextEpisode = findNextEpisode(show._embedded?.episodes ?? [], watchedIds);
    return nextEpisode ? toWatchingPick({ row, summary: stripHtml(show.summary), nextEpisode, locale }) : null;
  }

  private async loadDiscoveryPicks(context: RecommendationContext, hasFallback: boolean): Promise<NextBingeRecommendation[]> {
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
      if (!hasFallback) throw error;
      logger.warn('Discovery catalog unavailable; serving watchlist picks only', { error: String(error) });
      return [];
    }
  }
}
