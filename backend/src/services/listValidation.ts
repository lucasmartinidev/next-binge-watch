import { LIST_COLOR_IDS, LIST_ICON_IDS, RESERVED_PRIMARY_LIST_NAMES } from '../config/listCatalog';
import { AppError } from '../types/error';
import type { ListColorId, ListEntityType, ListIconId } from '../types/list';

const MAX_NAME_LENGTH = 60;
const MAX_DESCRIPTION_LENGTH = 240;
const MAX_TAGS_COUNT = 10;
const MAX_TAG_LENGTH = 24;
const VALID_ENTITY_TYPES: readonly ListEntityType[] = ['series', 'person'];

export function validateListEntityType(raw: unknown): ListEntityType {
  if (typeof raw === 'string' && VALID_ENTITY_TYPES.includes(raw as ListEntityType)) {
    return raw as ListEntityType;
  }
  throw new AppError('VALIDATION_ERROR', 'lists.invalidEntityType');
}

export function validateListName(raw: unknown): string {
  const trimmed = typeof raw === 'string' ? raw.trim() : '';
  if (!trimmed || trimmed.length > MAX_NAME_LENGTH) {
    throw new AppError('VALIDATION_ERROR', 'lists.invalidName');
  }
  if (RESERVED_PRIMARY_LIST_NAMES.has(trimmed.toLowerCase())) {
    throw new AppError('CONFLICT', 'lists.nameTaken');
  }
  return trimmed;
}

export function validateListDescription(raw: unknown): string | null {
  if (raw === undefined || raw === null) return null;
  if (typeof raw !== 'string') throw new AppError('VALIDATION_ERROR', 'lists.descriptionTooLong');
  const trimmed = raw.trim();
  if (trimmed.length > MAX_DESCRIPTION_LENGTH) throw new AppError('VALIDATION_ERROR', 'lists.descriptionTooLong');
  return trimmed.length > 0 ? trimmed : null;
}

export function validateListIcon(raw: unknown): ListIconId {
  if (typeof raw === 'string' && LIST_ICON_IDS.includes(raw as ListIconId)) return raw as ListIconId;
  throw new AppError('VALIDATION_ERROR', 'lists.invalidIcon');
}

export function validateListColor(raw: unknown): ListColorId {
  if (typeof raw === 'string' && LIST_COLOR_IDS.includes(raw as ListColorId)) return raw as ListColorId;
  throw new AppError('VALIDATION_ERROR', 'lists.invalidColor');
}

function normalizeTag(item: unknown): string {
  const trimmed = typeof item === 'string' ? item.trim() : '';
  if (!trimmed) throw new AppError('VALIDATION_ERROR', 'lists.invalidTags');
  if (trimmed.length > MAX_TAG_LENGTH) throw new AppError('VALIDATION_ERROR', 'lists.tagTooLong');
  return trimmed;
}

export function validateListTags(raw: unknown): string[] {
  if (raw === undefined) return [];
  if (!Array.isArray(raw)) throw new AppError('VALIDATION_ERROR', 'lists.invalidTags');
  const seen = new Set<string>();
  const tags: string[] = [];
  for (const item of raw) {
    const trimmed = normalizeTag(item);
    const lower = trimmed.toLowerCase();
    if (!seen.has(lower)) {
      seen.add(lower);
      tags.push(trimmed);
    }
  }
  if (tags.length > MAX_TAGS_COUNT) throw new AppError('VALIDATION_ERROR', 'lists.tooManyTags');
  return tags;
}

export function validateCustomListIds(raw: unknown): string[] {
  if (!Array.isArray(raw)) throw new AppError('VALIDATION_ERROR', 'lists.invalidListIds');
  const seen = new Set<string>();
  for (const item of raw) {
    if (typeof item !== 'string' || item.trim().length === 0) throw new AppError('VALIDATION_ERROR', 'lists.invalidListIds');
    seen.add(item.trim());
  }
  return [...seen];
}
