import { logger } from '../config/logger';
import type { TvmazeClient } from '../data/tvmazeClient';
import type { WatchedEpisodeRepository } from '../data/watchedEpisodeRepository';
import type { WatchlistRepository } from '../data/watchlistRepository';
import { AppError } from '../types/error';
import type { Locale } from '../types/locale';
import type { SeriesProfile } from '../types/series';
import type { TvmazeAka, TvmazeCrewMember } from '../types/tvmaze';
import { resolveLocalizedAka } from './akaResolver';
import type { ListMembershipService } from './listMembershipService';
import { buildSeriesProfile } from './seriesProfileMapper';

export class SeriesService {
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

  async getSeriesProfile(input: { id: number; locale: Locale }): Promise<SeriesProfile> {
    const show = await this.tvmaze.getShowWithEmbeds(input.id);
    if (!show) {
      throw new AppError('NOT_FOUND', 'series.notFound');
    }
    const [crewResult, akasResult, savedItem, watchedList, badgesMap] = await Promise.all([
      this.safeLoadCrew(input.id),
      this.safeLoadAkas(input.id, input.locale),
      this.watchlistRepo.findBySeriesId(input.id),
      this.watchedEpisodeRepo.listBySeriesId(input.id),
      this.membershipService ? this.membershipService.getSeriesBadgesMap([input.id], input.locale) : Promise.resolve(new Map()),
    ]);
    return buildSeriesProfile({
      show,
      crew: crewResult.crew,
      localizedName: akasResult.akas ? resolveLocalizedAka(akasResult.akas, input.locale) : null,
      savedStatus: savedItem?.status ?? null,
      watchedIds: new Set(watchedList.map((row) => row.episodeId)),
      lists: badgesMap.get(input.id) ?? [],
      partialData: crewResult.failed || akasResult.failed,
    });
  }

  private async safeLoadCrew(id: number): Promise<{ crew: TvmazeCrewMember[] | null; failed: boolean }> {
    try {
      return { crew: await this.tvmaze.getShowCrew(id), failed: false };
    } catch (error: unknown) {
      logger.warn('Failed to load show crew', { seriesId: id, error: String(error) });
      return { crew: null, failed: true };
    }
  }

  private async safeLoadAkas(
    id: number,
    locale: Locale,
  ): Promise<{ akas: TvmazeAka[] | null; failed: boolean }> {
    if (locale !== 'pt-BR') {
      return { akas: [], failed: false };
    }
    try {
      return { akas: await this.tvmaze.getShowAkas(id), failed: false };
    } catch (error: unknown) {
      logger.warn('Failed to load show AKAs', { seriesId: id, error: String(error) });
      return { akas: null, failed: true };
    }
  }
}
