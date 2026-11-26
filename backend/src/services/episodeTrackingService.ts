import type { TvmazeClient } from '../data/tvmazeClient';
import type { WatchedEpisodeRepository } from '../data/watchedEpisodeRepository';
import type { StoredWatchlistRow, WatchlistRepository } from '../data/watchlistRepository';
import { AppError } from '../types/error';
import type { TvmazeEpisode, TvmazeShow } from '../types/tvmaze';
import type { SeriesTrackingState } from '../types/watchlist';
import { buildTrackingState } from './seriesMapper';
import { computeSyncedStatus } from './watchlistMapper';

type EpisodeChangeInput = {
  show: TvmazeShow;
  allEpisodes: TvmazeEpisode[];
  targets: TvmazeEpisode[];
  watched: boolean;
};

export class EpisodeTrackingService {
  constructor(
    private readonly tvmaze: TvmazeClient,
    private readonly watchlistRepo: WatchlistRepository,
    private readonly watchedEpisodeRepo: WatchedEpisodeRepository,
  ) {}

  async toggleEpisode(input: { seriesId: number; episodeId: number; watched: boolean }): Promise<SeriesTrackingState> {
    const show = await this.requireShow(input.seriesId);
    const episodes = show._embedded?.episodes ?? [];
    const target = episodes.find((ep) => ep.id === input.episodeId);
    if (!target) {
      throw new AppError('NOT_FOUND', 'watchlist.episodeNotFound');
    }
    return this.applyEpisodeChange({ show, allEpisodes: episodes, targets: [target], watched: input.watched });
  }

  async toggleSeason(input: { seriesId: number; seasonNumber: number; watched: boolean }): Promise<SeriesTrackingState> {
    const show = await this.requireShow(input.seriesId);
    const episodes = show._embedded?.episodes ?? [];
    const seasonEpisodes = episodes.filter((ep) => ep.season === input.seasonNumber);
    if (seasonEpisodes.length === 0) {
      throw new AppError('NOT_FOUND', 'watchlist.seasonNotFound');
    }
    return this.applyEpisodeChange({ show, allEpisodes: episodes, targets: seasonEpisodes, watched: input.watched });
  }

  private async applyEpisodeChange(input: EpisodeChangeInput): Promise<SeriesTrackingState> {
    const { show, allEpisodes, targets, watched } = input;
    const saved = await this.ensureSavedIfWatched(show, allEpisodes.length, watched);
    if (watched) {
      await this.watchedEpisodeRepo.markEpisodes(
        targets.map((ep) => ({ seriesId: show.id, episodeId: ep.id, seasonNumber: ep.season, episodeNumber: ep.number ?? 0 })),
      );
    } else {
      await this.watchedEpisodeRepo.unmarkEpisodes(show.id, targets.map((ep) => ep.id));
    }
    const watchedRows = await this.watchedEpisodeRepo.listBySeriesId(show.id);
    const watchedIds = new Set(watchedRows.map((row) => row.episodeId));
    const nextStatus = saved ? computeSyncedStatus(saved.status, watchedIds.size, allEpisodes.length) : null;
    if (saved && nextStatus && nextStatus !== saved.status) {
      await this.watchlistRepo.updateStatus(show.id, nextStatus);
    }
    return buildTrackingState(allEpisodes, watchedIds, nextStatus);
  }

  private async ensureSavedIfWatched(
    show: TvmazeShow,
    totalEpisodes: number,
    watched: boolean,
  ): Promise<StoredWatchlistRow | null> {
    const existing = await this.watchlistRepo.findBySeriesId(show.id);
    if (existing || !watched) {
      return existing;
    }
    await this.watchlistRepo.upsert({
      seriesId: show.id,
      name: show.name,
      localizedNamePtBr: null,
      imageUrl: show.image?.medium ?? show.image?.original ?? null,
      status: 'watching',
      genres: show.genres ?? [],
      rating: show.rating?.average ?? null,
      totalEpisodes,
      tvmazeUrl: show.url,
    });
    return this.watchlistRepo.findBySeriesId(show.id);
  }

  private async requireShow(seriesId: number): Promise<TvmazeShow> {
    const show = await this.tvmaze.getShowWithEmbeds(seriesId);
    if (!show) {
      throw new AppError('NOT_FOUND', 'series.notFound');
    }
    return show;
  }
}
