import type { DatabaseClient } from './database';
import type { StoredWatchedEpisode } from './watchlistRepository';
import { toIsoTimestamp } from './watchlistRowMapper';

export type EpisodeMarkInput = {
  userId: string;
  seriesId: number;
  episodeId: number;
  seasonNumber: number;
  episodeNumber: number;
};

const MARK_EPISODES_SQL = `INSERT INTO watched_episodes (
  user_id, series_id, episode_id, season_number, episode_number, watched_at
)
SELECT * FROM UNNEST($1::uuid[], $2::int[], $3::int[], $4::int[], $5::int[], $6::timestamptz[])
ON CONFLICT (user_id, series_id, episode_id) DO NOTHING`;

export class WatchedEpisodeRepository {
  constructor(private readonly db: DatabaseClient) {}

  async listBySeriesId(userId: string, seriesId: number): Promise<StoredWatchedEpisode[]> {
    const result = await this.db.query(
      `SELECT series_id, episode_id, season_number, episode_number, watched_at
       FROM watched_episodes WHERE user_id = $1 AND series_id = $2
       ORDER BY season_number ASC, episode_number ASC`,
      [userId, seriesId],
    );
    return result.rows.map((row) => ({
      seriesId: Number(row.series_id),
      episodeId: Number(row.episode_id),
      seasonNumber: Number(row.season_number),
      episodeNumber: Number(row.episode_number),
      watchedAt: toIsoTimestamp(row.watched_at),
    }));
  }

  async listAllCounts(userId: string): Promise<Map<number, number>> {
    const result = await this.db.query(
      'SELECT series_id, COUNT(*) AS watched_count FROM watched_episodes WHERE user_id = $1 GROUP BY series_id',
      [userId],
    );
    const counts = new Map<number, number>();
    for (const row of result.rows) {
      counts.set(Number(row.series_id), Number(row.watched_count));
    }
    return counts;
  }

  async markEpisodes(episodes: EpisodeMarkInput[]): Promise<void> {
    if (episodes.length === 0) return;
    const now = new Date().toISOString();
    await this.db.query(MARK_EPISODES_SQL, [
      episodes.map((ep) => ep.userId),
      episodes.map((ep) => ep.seriesId),
      episodes.map((ep) => ep.episodeId),
      episodes.map((ep) => ep.seasonNumber),
      episodes.map((ep) => ep.episodeNumber),
      episodes.map(() => now),
    ]);
  }

  async unmarkEpisodes(userId: string, seriesId: number, episodeIds: number[]): Promise<void> {
    if (episodeIds.length === 0) return;
    await this.db.query(
      'DELETE FROM watched_episodes WHERE user_id = $1 AND series_id = $2 AND episode_id = ANY($3::int[])',
      [userId, seriesId, episodeIds],
    );
  }
}
