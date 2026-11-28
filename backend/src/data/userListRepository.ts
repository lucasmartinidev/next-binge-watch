import type { ListColorId, ListEntityType, ListIconId } from '../types/list';
import type { DatabaseClient } from './database';
import { mapUserListRow, type StoredUserList } from './userListMapper';

export type CreateStoredListInput = {
  id: string;
  userId: string;
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
    WHEN ul.is_system THEN (SELECT COUNT(*) FROM watchlist_items wi WHERE wi.user_id = ul.user_id AND wi.status = ul.system_key)
    WHEN ul.entity_type = 'series' THEN (SELECT COUNT(*) FROM custom_list_series cls WHERE cls.user_id = ul.user_id AND cls.list_id = ul.id)
    ELSE (SELECT COUNT(*) FROM custom_list_people clp WHERE clp.user_id = ul.user_id AND clp.list_id = ul.id)
  END AS item_count
FROM user_lists ul`;

export class UserListRepository {
  constructor(private readonly db: DatabaseClient) {}

  async listAllWithCounts(userId: string): Promise<StoredUserList[]> {
    const result = await this.db.query(
      `${LIST_WITH_COUNTS_SELECT} WHERE ul.user_id = $1 ORDER BY ul.is_system DESC, ul.created_at ASC, ul.name ASC`,
      [userId],
    );
    return result.rows.map((row) => mapUserListRow(row as Record<string, unknown>));
  }

  async findById(userId: string, listId: string): Promise<StoredUserList | null> {
    const result = await this.db.query(
      `${LIST_WITH_COUNTS_SELECT} WHERE ul.user_id = $1 AND (ul.id = $2 OR ul.system_key = $2) LIMIT 1`,
      [userId, listId],
    );
    const row = result.rows[0];
    return row ? mapUserListRow(row as Record<string, unknown>) : null;
  }

  async findByLowerName(userId: string, lowerName: string, excludeId?: string): Promise<StoredUserList | null> {
    const result = excludeId
      ? await this.db.query('SELECT * FROM user_lists WHERE user_id = $1 AND LOWER(name) = $2 AND id <> $3', [
          userId, lowerName, excludeId,
        ])
      : await this.db.query('SELECT * FROM user_lists WHERE user_id = $1 AND LOWER(name) = $2', [userId, lowerName]);
    const row = result.rows[0];
    return row ? mapUserListRow(row as Record<string, unknown>) : null;
  }

  async create(input: CreateStoredListInput): Promise<StoredUserList> {
    const now = new Date().toISOString();
    await this.db.query(
      `INSERT INTO user_lists (id, user_id, is_system, system_key, entity_type, name, description, icon, color, tags, created_at, updated_at)
       VALUES ($1, $2, FALSE, NULL, $3, $4, $5, $6, $7, $8::jsonb, $9, $10)`,
      [input.id, input.userId, input.entityType, input.name, input.description, input.icon, input.color, JSON.stringify(input.tags), now, now],
    );
    return (await this.findById(input.userId, input.id))!;
  }

  async update(userId: string, listId: string, patch: UpdateStoredListInput): Promise<StoredUserList | null> {
    const existing = await this.findById(userId, listId);
    if (!existing) return null;
    const now = new Date().toISOString();
    await this.db.query(
      `UPDATE user_lists SET name = $1, description = $2, icon = $3, color = $4, tags = $5::jsonb, updated_at = $6
       WHERE id = $7 AND user_id = $8`,
      [
        patch.name ?? existing.name,
        patch.description === undefined ? existing.description : patch.description,
        patch.icon ?? existing.icon,
        patch.color ?? existing.color,
        JSON.stringify(patch.tags ?? existing.tags),
        now,
        existing.id,
        userId,
      ],
    );
    return this.findById(userId, existing.id);
  }

  async deleteCustomById(userId: string, listId: string): Promise<boolean> {
    const result = await this.db.query('DELETE FROM user_lists WHERE id = $1 AND user_id = $2 AND is_system = FALSE', [
      listId,
      userId,
    ]);
    return (result.rowCount ?? 0) > 0;
  }
}
