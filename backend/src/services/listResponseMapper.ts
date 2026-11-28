import { getPrimaryListCopy } from '../config/listCatalog';
import type { StoredUserList } from '../data/userListMapper';
import type { UpdateStoredListInput } from '../data/userListRepository';
import type { ListBadgeSummary, UpdateListInput, UserListSummary } from '../types/list';
import type { Locale } from '../types/locale';
import { validateListColor, validateListDescription, validateListIcon, validateListName, validateListTags } from './listValidation';

export function buildCustomListPatch(patch: UpdateListInput): UpdateStoredListInput {
  return {
    name: patch.name !== undefined ? validateListName(patch.name) : undefined,
    description: patch.description !== undefined ? validateListDescription(patch.description) : undefined,
    icon: patch.icon !== undefined ? validateListIcon(patch.icon) : undefined,
    color: patch.color !== undefined ? validateListColor(patch.color) : undefined,
    tags: patch.tags !== undefined ? validateListTags(patch.tags) : undefined,
  };
}

export function toListBadge(list: StoredUserList, locale: Locale): ListBadgeSummary {
  const name = list.isSystem && list.systemKey ? getPrimaryListCopy(list.systemKey, locale).name : list.name;
  return {
    id: list.id,
    name,
    icon: list.icon,
    color: list.color,
    isSystem: list.isSystem,
    systemKey: list.systemKey,
  };
}

export function toUserListSummary(list: StoredUserList, locale: Locale): UserListSummary {
  const localized = list.isSystem && list.systemKey ? getPrimaryListCopy(list.systemKey, locale) : null;
  return {
    id: list.id,
    isSystem: list.isSystem,
    systemKey: list.systemKey,
    entityType: list.entityType,
    name: localized ? localized.name : list.name,
    description: localized ? localized.description : list.description,
    icon: list.icon,
    color: list.color,
    tags: list.tags,
    itemCount: list.itemCount,
    updatedAt: list.updatedAt,
  };
}
