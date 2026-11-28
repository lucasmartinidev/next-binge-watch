import type { ListColorId, ListEntityType, ListIconId } from '../types/list';
import type { DatabaseClient } from './database';
import { mapUserListRow, type StoredUserList } from './userListMapper';

export type CreateStoredListInput = {
  id: string;
  entityType: ListEntityType;
  name: string;
  description: string | null;
  icon: ListIconId;
  color: ListColorId;
  tags: string[];
};

export type UpdateStoredListInput = {
  name?: string;
  description?: string | null;
  icon?: ListIconId;
  color?: ListColorId;
  tags?: string[];
};

const LIST_WITH_COUNTS_SELECT = `SELECT ul.*,
  CASE
    WHEN ul.is_system THEN (SELECT COUNT(*) FROM watchlist_items wi WHERE wi.status = ul.system_key)
    WHEN ul.entity_type = 'series' THEN (SELECT COUNT(*) FROM custom_list_series cls WHERE cls.list_id = ul.id)
    ELSE (SELECT COUNT(*) FROM custom_list_people clp WHERE clp.list_id = ul.id)
  END AS item_count
FROM user_lists ul`;

export class UserListRepository {
  constructor(private readonly db: DatabaseClient) {}

  async listAllWithCounts(): Promise<StoredUserList[]> {
    const result = await this.db.query(
      `${LIST_WITH_COUNTS_SELECT} ORDER BY ul.is_system DESC, ul.created_at ASC, ul.name ASC`,
    );
    return result.rows.map((row) => mapUserListRow(row as Record<string, unknown>));
  }

  async findById(listId: string): Promise<StoredUserList | null> {
    const result = await this.db.query(`${LIST_WITH_COUNTS_SELECT} WHERE ul.id = $1`, [listId]);
    const row = result.rows[0];
    return row ? mapUserListRow(row as Record<string, unknown>) : null;
  }

  async findByLowerName(lowerName: string, excludeId?: string): Promise<StoredUserList | null> {
    const result = excludeId
      ? await this.db.query('SELECT * FROM user_lists WHERE LOWER(name) = $1 AND id <> $2', [lowerName, excludeId])
      : await this.db.query('SELECT * FROM user_lists WHERE LOWER(name) = $1', [lowerName]);
    const row = result.rows[0];
    return row ? mapUserListRow(row as Record<string, unknown>) : null;
  }

  async create(input: CreateStoredListInput): Promise<StoredUserList> {
    const now = new Date().toISOString();
    await this.db.query(
      `INSERT INTO user_lists (id, is_system, system_key, entity_type, name, description, icon, color, tags, created_at, updated_at)
       VALUES ($1, FALSE, NULL, $2, $3, $4, $5, $6, $7::jsonb, $8, $9)`,
      [input.id, input.entityType, input.name, input.description, input.icon, input.color, JSON.stringify(input.tags), now, now],
    );
    return (await this.findById(input.id))!;
  }

  async update(listId: string, patch: UpdateStoredListInput): Promise<StoredUserList | null> {
    const existing = await this.findById(listId);
    if (!existing) {
      return null;
    }
    const now = new Date().toISOString();
    await this.db.query(
      `UPDATE user_lists SET name = $1, description = $2, icon = $3, color = $4, tags = $5::jsonb, updated_at = $6 WHERE id = $7`,
      [
        patch.name ?? existing.name,
        patch.description === undefined ? existing.description : patch.description,
        patch.icon ?? existing.icon,
        patch.color ?? existing.color,
        JSON.stringify(patch.tags ?? existing.tags),
        now,
        listId,
      ],
    );
    return this.findById(listId);
  }

  async deleteCustomById(listId: string): Promise<boolean> {
    const result = await this.db.query('DELETE FROM user_lists WHERE id = $1 AND is_system = FALSE', [listId]);
    return (result.rowCount ?? 0) > 0;
  }
}
