import type { DatabaseClient } from './database';
import type { StoredWatchedEpisode } from './watchlistRepository';

export type EpisodeMarkInput = {
  seriesId: number;
  episodeId: number;
  seasonNumber: number;
  episodeNumber: number;
};

export class WatchedEpisodeRepository {
  constructor(private readonly db: DatabaseClient) {}

  async listBySeriesId(seriesId: number): Promise<StoredWatchedEpisode[]> {
    const result = await this.db.execute({
      sql: `SELECT series_id, episode_id, season_number, episode_number, watched_at
            FROM watched_episodes WHERE series_id = ?
            ORDER BY season_number ASC, episode_number ASC`,
      args: [seriesId],
    });
    return result.rows.map((row) => ({
      seriesId: Number(row.series_id),
      episodeId: Number(row.episode_id),
      seasonNumber: Number(row.season_number),
      episodeNumber: Number(row.episode_number),
      watchedAt: String(row.watched_at),
    }));
  }

  async listAllCounts(): Promise<Map<number, number>> {
    const result = await this.db.execute(
      'SELECT series_id, COUNT(*) AS watched_count FROM watched_episodes GROUP BY series_id',
    );
    const counts = new Map<number, number>();
    for (const row of result.rows) {
      counts.set(Number(row.series_id), Number(row.watched_count));
    }
    return counts;
  }

  async markEpisodes(episodes: EpisodeMarkInput[]): Promise<void> {
    if (episodes.length === 0) {
      return;
    }
    const now = new Date().toISOString();
    await this.db.batch(
      episodes.map((episode) => ({
        sql: `INSERT OR IGNORE INTO watched_episodes (
          series_id, episode_id, season_number, episode_number, watched_at
        ) VALUES (?, ?, ?, ?, ?)`,
        args: [episode.seriesId, episode.episodeId, episode.seasonNumber, episode.episodeNumber, now],
      })),
      'write',
    );
  }

  async unmarkEpisodes(seriesId: number, episodeIds: number[]): Promise<void> {
    if (episodeIds.length === 0) {
      return;
    }
    await this.db.batch(
      episodeIds.map((episodeId) => ({
        sql: 'DELETE FROM watched_episodes WHERE series_id = ? AND episode_id = ?',
        args: [seriesId, episodeId],
      })),
      'write',
    );
  }
}
