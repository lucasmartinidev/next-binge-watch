import type { WatchStatus } from '../types/watchlist';
import type { DatabaseClient } from './database';
import { mapUserListRow, type StoredUserList } from './userListMapper';
import type { StoredWatchlistRow } from './watchlistRepository';
import { mapWatchlistRow, toIsoTimestamp } from './watchlistRowMapper';

export type StoredPersonSnapshot = {
  personId: number;
  name: string;
  imageUrl: string | null;
  country: string | null;
  tvmazeUrl: string;
};

export type StoredCustomListPerson = StoredPersonSnapshot & { listId: string; addedAt: string };
export type StoredSeriesListMembership = { primaryStatus: WatchStatus | null; customLists: StoredUserList[] };

export async function querySeriesMemberships(db: DatabaseClient, userId: string, seriesIds: number[]): Promise<Map<number, StoredSeriesListMembership>> {
  const map = new Map<number, StoredSeriesListMembership>();
  if (seriesIds.length === 0) return map;
  const [statusResult, customResult] = await Promise.all([
    db.query('SELECT series_id, status FROM watchlist_items WHERE user_id = $1 AND series_id = ANY($2::int[])', [userId, seriesIds]),
    db.query(
      `SELECT cls.series_id, ul.* FROM custom_list_series cls
       JOIN user_lists ul ON ul.id = cls.list_id AND ul.user_id = cls.user_id
       WHERE cls.user_id = $1 AND cls.series_id = ANY($2::int[]) ORDER BY ul.name ASC`,
      [userId, seriesIds],
    ),
  ]);
  for (const row of statusResult.rows) {
    map.set(Number(row.series_id), { primaryStatus: String(row.status) as WatchStatus, customLists: [] });
  }
  for (const row of customResult.rows) {
    const seriesId = Number(row.series_id);
    const entry = map.get(seriesId) ?? { primaryStatus: null, customLists: [] };
    entry.customLists.push(mapUserListRow(row as Record<string, unknown>));
    map.set(seriesId, entry);
  }
  return map;
}

export async function queryPersonMemberships(db: DatabaseClient, userId: string, personIds: number[]): Promise<Map<number, StoredUserList[]>> {
  const map = new Map<number, StoredUserList[]>();
  if (personIds.length === 0) return map;
  const result = await db.query(
    `SELECT clp.person_id, ul.* FROM custom_list_people clp
     JOIN user_lists ul ON ul.id = clp.list_id AND ul.user_id = clp.user_id
     WHERE clp.user_id = $1 AND clp.person_id = ANY($2::int[]) ORDER BY ul.name ASC`,
    [userId, personIds],
  );
  for (const row of result.rows) {
    const personId = Number(row.person_id);
    const lists = map.get(personId) ?? [];
    lists.push(mapUserListRow(row as Record<string, unknown>));
    map.set(personId, lists);
  }
  return map;
}

export async function querySeriesByCustomListId(db: DatabaseClient, userId: string, listId: string): Promise<StoredWatchlistRow[]> {
  const result = await db.query(
    `SELECT wi.* FROM custom_list_series cls
     JOIN watchlist_items wi ON wi.user_id = cls.user_id AND wi.series_id = cls.series_id
     WHERE cls.user_id = $1 AND cls.list_id = $2 ORDER BY cls.added_at DESC`,
    [userId, listId],
  );
  return result.rows.map((row) => mapWatchlistRow(row as Record<string, unknown>));
}

export async function queryPeopleByCustomListId(db: DatabaseClient, userId: string, listId: string): Promise<StoredCustomListPerson[]> {
  const result = await db.query(
    `SELECT list_id, person_id, name, image_url, country, tvmaze_url, added_at
     FROM custom_list_people WHERE user_id = $1 AND list_id = $2 ORDER BY added_at DESC`,
    [userId, listId],
  );
  return result.rows.map((row) => ({
    listId: String(row.list_id),
    personId: Number(row.person_id),
    name: String(row.name),
    imageUrl: row.image_url === null ? null : String(row.image_url),
    country: row.country === null ? null : String(row.country),
    tvmazeUrl: String(row.tvmaze_url),
    addedAt: toIsoTimestamp(row.added_at),
  }));
}
