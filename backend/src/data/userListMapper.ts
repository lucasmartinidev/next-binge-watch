import type { ListColorId, ListEntityType, ListIconId } from '../types/list';
import type { WatchStatus } from '../types/watchlist';
import { toIsoTimestamp } from './watchlistRowMapper';

export type StoredUserList = {
  id: string;
  isSystem: boolean;
  systemKey: WatchStatus | null;
  entityType: ListEntityType;
  name: string;
  description: string | null;
  icon: ListIconId;
  color: ListColorId;
  tags: string[];
  itemCount: number;
  createdAt: string;
  updatedAt: string;
};

function parseTags(raw: unknown): string[] {
  if (Array.isArray(raw)) {
    return raw.map((item) => String(item));
  }
  if (typeof raw === 'string') {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map((item) => String(item)) : [];
  }
  return [];
}

export function mapUserListRow(row: Record<string, unknown>): StoredUserList {
  return {
    id: String(row.id),
    isSystem: Boolean(row.is_system),
    systemKey: row.system_key === null || row.system_key === undefined ? null : (String(row.system_key) as WatchStatus),
    entityType: String(row.entity_type) as ListEntityType,
    name: String(row.name),
    description: row.description === null || row.description === undefined ? null : String(row.description),
    icon: String(row.icon) as ListIconId,
    color: String(row.color) as ListColorId,
    tags: parseTags(row.tags),
    itemCount: Number(row.item_count ?? 0),
    createdAt: toIsoTimestamp(row.created_at),
    updatedAt: toIsoTimestamp(row.updated_at),
  };
}
