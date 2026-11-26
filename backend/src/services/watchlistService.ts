import type { TvmazeClient } from '../data/tvmazeClient';
import type { WatchedEpisodeRepository } from '../data/watchedEpisodeRepository';
import type { StoredWatchlistRow, WatchlistRepository } from '../data/watchlistRepository';
import { AppError } from '../types/error';
import type { Locale } from '../types/locale';
import type { WatchStatus, WatchlistItem, WatchlistResponse } from '../types/watchlist';
import { resolveLocalizedAka } from './akaResolver';
import { findNextEpisode, mapWatchlistItem } from './watchlistMapper';

export class WatchlistService {
  constructor(
    private readonly tvmaze: TvmazeClient,
    private readonly watchlistRepo: WatchlistRepository,
    private readonly watchedEpisodeRepo: WatchedEpisodeRepository,
  ) {}

  async list(input: { status?: WatchStatus; locale: Locale }): Promise<WatchlistResponse> {
    const [rows, counts] = await Promise.all([
      this.watchlistRepo.listAll(input.status),
      this.watchedEpisodeRepo.listAllCounts(),
    ]);
    const items = await Promise.all(
      rows.map(async (row) => {
        const watchedEpisodes = counts.get(row.seriesId) ?? 0;
        const nextEpisode = row.status === 'watching' ? await this.safeNextEpisode(row.seriesId) : null;
        return mapWatchlistItem({ row, watchedEpisodes, locale: input.locale, nextEpisode });
      }),
    );
    return { total: items.length, items };
  }

  async addSeries(input: { seriesId: number; status: WatchStatus; locale: Locale }): Promise<WatchlistItem> {
    const show = await this.tvmaze.getShowWithEmbeds(input.seriesId);
    if (!show) {
      throw new AppError('NOT_FOUND', 'series.notFound');
    }
    const localizedNamePtBr = await this.safeLoadPtBrAka(input.seriesId, input.locale);
    await this.watchlistRepo.upsert({
      seriesId: show.id, name: show.name, localizedNamePtBr,
      imageUrl: show.image?.medium ?? show.image?.original ?? null,
      status: input.status, genres: show.genres ?? [],
      rating: show.rating?.average ?? null, totalEpisodes: (show._embedded?.episodes ?? []).length,
      tvmazeUrl: show.url,
    });
    const [saved, watched] = await Promise.all([
      this.requireSavedRow(show.id),
      this.watchedEpisodeRepo.listBySeriesId(show.id),
    ]);
    return mapWatchlistItem({ row: saved, watchedEpisodes: watched.length, locale: input.locale });
  }

  async updateStatus(input: { seriesId: number; status: WatchStatus; locale: Locale }): Promise<WatchlistItem> {
    if (!(await this.watchlistRepo.updateStatus(input.seriesId, input.status))) {
      throw new AppError('NOT_FOUND', 'watchlist.notFound');
    }
    const [saved, watched] = await Promise.all([
      this.requireSavedRow(input.seriesId),
      this.watchedEpisodeRepo.listBySeriesId(input.seriesId),
    ]);
    return mapWatchlistItem({ row: saved, watchedEpisodes: watched.length, locale: input.locale });
  }

  async removeSeries(seriesId: number): Promise<void> {
    if (!(await this.watchlistRepo.deleteBySeriesId(seriesId))) {
      throw new AppError('NOT_FOUND', 'watchlist.notFound');
    }
  }

  private async requireSavedRow(seriesId: number): Promise<StoredWatchlistRow> {
    const saved = await this.watchlistRepo.findBySeriesId(seriesId);
    if (!saved) {
      throw new AppError('NOT_FOUND', 'watchlist.notFound');
    }
    return saved;
  }

  private async safeLoadPtBrAka(seriesId: number, locale: Locale): Promise<string | null> {
    if (locale !== 'pt-BR') {
      return null;
    }
    try {
      return resolveLocalizedAka(await this.tvmaze.getShowAkas(seriesId), 'pt-BR');
    } catch {
      return null;
    }
  }

  private async safeNextEpisode(seriesId: number) {
    try {
      const [show, watchedRows] = await Promise.all([
        this.tvmaze.getShowWithEmbeds(seriesId),
        this.watchedEpisodeRepo.listBySeriesId(seriesId),
      ]);
      return show ? findNextEpisode(show._embedded?.episodes ?? [], new Set(watchedRows.map((r) => r.episodeId))) : null;
    } catch {
      return null;
    }
  }
}
