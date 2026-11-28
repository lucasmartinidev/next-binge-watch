import type { PoolClient } from 'pg';
import type { DatabaseClient } from './database';
import {
  queryPeopleByCustomListId,
  queryPersonMemberships,
  querySeriesByCustomListId,
  querySeriesMemberships,
  type StoredCustomListPerson,
  type StoredPersonSnapshot,
  type StoredSeriesListMembership,
} from './listMembershipQueries';
import type { StoredUserList } from './userListMapper';
import type { StoredWatchlistRow } from './watchlistRepository';

export type { StoredCustomListPerson, StoredPersonSnapshot, StoredSeriesListMembership };
type QueryRunner = Pick<DatabaseClient, 'query'>;

export class ListMembershipRepository {
  constructor(private readonly db: DatabaseClient) {}

  async runTransaction<T>(fn: (client?: PoolClient) => Promise<T>): Promise<T> {
    const client = await this.db.connect();
    try {
      await client.query('BEGIN');
      const result = await fn(client);
      await client.query('COMMIT');
      return result;
    } catch (error: unknown) {
      await client.query('ROLLBACK').catch(() => undefined);
      throw error;
    } finally {
      client.release();
    }
  }

  findSeriesMemberships(userId: string, seriesIds: number[]): Promise<Map<number, StoredSeriesListMembership>> {
    return querySeriesMemberships(this.db, userId, seriesIds);
  }

  findPersonMemberships(userId: string, personIds: number[]): Promise<Map<number, StoredUserList[]>> {
    return queryPersonMemberships(this.db, userId, personIds);
  }

  listSeriesByCustomListId(userId: string, listId: string): Promise<StoredWatchlistRow[]> {
    return querySeriesByCustomListId(this.db, userId, listId);
  }

  listPeopleByCustomListId(userId: string, listId: string): Promise<StoredCustomListPerson[]> {
    return queryPeopleByCustomListId(this.db, userId, listId);
  }

  async replaceSeriesCustomLists(input: { userId: string; seriesId: number; listIds: string[]; dbClient?: PoolClient }): Promise<void> {
    const runner: QueryRunner = input.dbClient ?? this.db;
    await runner.query('DELETE FROM custom_list_series WHERE user_id = $1 AND series_id = $2', [input.userId, input.seriesId]);
    if (input.listIds.length === 0) return;
    await runner.query(
      `INSERT INTO custom_list_series (list_id, user_id, series_id, added_at)
       SELECT list_id, $2, $3, NOW() FROM UNNEST($1::text[]) AS list_id
       ON CONFLICT (list_id, series_id) DO NOTHING`,
      [input.listIds, input.userId, input.seriesId],
    );
  }

  async replacePersonCustomLists(input: { userId: string; person: StoredPersonSnapshot; listIds: string[]; dbClient?: PoolClient }): Promise<void> {
    const runner: QueryRunner = input.dbClient ?? this.db;
    await runner.query('DELETE FROM custom_list_people WHERE user_id = $1 AND person_id = $2', [input.userId, input.person.personId]);
    if (input.listIds.length === 0) return;
    const { person } = input;
    await runner.query(
      `INSERT INTO custom_list_people (list_id, user_id, person_id, name, image_url, country, tvmaze_url, added_at)
       SELECT list_id, $2, $3, $4, $5, $6, $7, NOW() FROM UNNEST($1::text[]) AS list_id
       ON CONFLICT (list_id, person_id) DO NOTHING`,
      [input.listIds, input.userId, person.personId, person.name, person.imageUrl, person.country, person.tvmazeUrl],
    );
  }

  async removeSeriesFromCustomList(userId: string, listId: string, seriesId: number): Promise<boolean> {
    const result = await this.db.query(
      'DELETE FROM custom_list_series WHERE user_id = $1 AND list_id = $2 AND series_id = $3',
      [userId, listId, seriesId],
    );
    return (result.rowCount ?? 0) > 0;
  }

  async removePersonFromCustomList(userId: string, listId: string, personId: number): Promise<boolean> {
    const result = await this.db.query(
      'DELETE FROM custom_list_people WHERE user_id = $1 AND list_id = $2 AND person_id = $3',
      [userId, listId, personId],
    );
    return (result.rowCount ?? 0) > 0;
  }
}
