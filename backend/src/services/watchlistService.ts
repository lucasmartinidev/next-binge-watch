import type { TvmazeClient } from '../data/tvmazeClient';
import type { WatchedEpisodeRepository } from '../data/watchedEpisodeRepository';
import type { StoredWatchlistRow, WatchlistRepository } from '../data/watchlistRepository';
import { AppError } from '../types/error';
import type { ListBadgeSummary } from '../types/list';
import type { Locale } from '../types/locale';
import type { WatchStatus, WatchlistItem, WatchlistResponse } from '../types/watchlist';
import { resolveLocalizedAka } from './akaResolver';
import type { ListMembershipService } from './listMembershipService';
import { findNextEpisode, mapWatchlistItem } from './watchlistMapper';

export class WatchlistService {
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

  async list(input: { status?: WatchStatus; locale: Locale }): Promise<WatchlistResponse> {
    const [rows, counts] = await Promise.all([this.watchlistRepo.listAll(input.status), this.watchedEpisodeRepo.listAllCounts()]);
    const badgesMap = await this.loadBadges(rows.map((r) => r.seriesId), input.locale);
    const items = await Promise.all(
      rows.map(async (row) => {
        const watchedEpisodes = counts.get(row.seriesId) ?? 0;
        const nextEpisode = row.status === 'watching' ? await this.safeNextEpisode(row.seriesId) : null;
        return mapWatchlistItem({ row, watchedEpisodes, locale: input.locale, nextEpisode, lists: badgesMap.get(row.seriesId) });
      }),
    );
    return { total: items.length, items };
  }

  async addSeries(input: { seriesId: number; status: WatchStatus; locale: Locale }): Promise<WatchlistItem> {
    const show = await this.tvmaze.getShowWithEmbeds(input.seriesId);
    if (!show) throw new AppError('NOT_FOUND', 'series.notFound');
    const localizedNamePtBr = await this.safeLoadPtBrAka(input.seriesId, input.locale);
    await this.watchlistRepo.upsert({
      seriesId: show.id, name: show.name, localizedNamePtBr,
      imageUrl: show.image?.medium ?? show.image?.original ?? null,
      status: input.status, genres: show.genres ?? [],
      rating: show.rating?.average ?? null, totalEpisodes: (show._embedded?.episodes ?? []).length, tvmazeUrl: show.url,
    });
    const [saved, watched, badges] = await Promise.all([
      this.requireSavedRow(show.id), this.watchedEpisodeRepo.listBySeriesId(show.id), this.loadBadges([show.id], input.locale),
    ]);
    return mapWatchlistItem({ row: saved, watchedEpisodes: watched.length, locale: input.locale, lists: badges.get(show.id) });
  }

  async updateStatus(input: { seriesId: number; status: WatchStatus; locale: Locale }): Promise<WatchlistItem> {
    if (!(await this.watchlistRepo.updateStatus(input.seriesId, input.status))) throw new AppError('NOT_FOUND', 'watchlist.notFound');
    const [saved, watched, badges] = await Promise.all([
      this.requireSavedRow(input.seriesId), this.watchedEpisodeRepo.listBySeriesId(input.seriesId), this.loadBadges([input.seriesId], input.locale),
    ]);
    return mapWatchlistItem({ row: saved, watchedEpisodes: watched.length, locale: input.locale, lists: badges.get(input.seriesId) });
  }

  async removeSeries(seriesId: number): Promise<void> {
    if (!(await this.watchlistRepo.deleteBySeriesId(seriesId))) throw new AppError('NOT_FOUND', 'watchlist.notFound');
  }

  private loadBadges(seriesIds: number[], locale: Locale): Promise<Map<number, ListBadgeSummary[]>> {
    return this.membershipService ? this.membershipService.getSeriesBadgesMap(seriesIds, locale) : Promise.resolve(new Map());
  }

  private async requireSavedRow(seriesId: number): Promise<StoredWatchlistRow> {
    const saved = await this.watchlistRepo.findBySeriesId(seriesId);
    if (!saved) throw new AppError('NOT_FOUND', 'watchlist.notFound');
    return saved;
  }

  private async safeLoadPtBrAka(seriesId: number, locale: Locale): Promise<string | null> {
    if (locale !== 'pt-BR') return null;
    try {
      return resolveLocalizedAka(await this.tvmaze.getShowAkas(seriesId), 'pt-BR');
    } catch {
      return null;
    }
  }

  private async safeNextEpisode(seriesId: number) {
    try {
      const [show, watchedRows] = await Promise.all([this.tvmaze.getShowWithEmbeds(seriesId), this.watchedEpisodeRepo.listBySeriesId(seriesId)]);
      return show ? findNextEpisode(show._embedded?.episodes ?? [], new Set(watchedRows.map((r) => r.episodeId))) : null;
    } catch {
      return null;
    }
  }
}
