import type { WatchStatus, WatchlistItem } from './watchlist';

export type ListEntityType = 'series' | 'person';

export type ListIconId =
  | 'bookmark'
  | 'play'
  | 'check-circle'
  | 'star'
  | 'heart'
  | 'flame'
  | 'tv'
  | 'film'
  | 'sparkles'
  | 'clock'
  | 'trophy'
  | 'users'
  | 'user-check'
  | 'clapperboard'
  | 'compass'
  | 'rocket';

export type ListColorId = 'cyan' | 'violet' | 'pink' | 'amber' | 'emerald' | 'orange' | 'sky' | 'yellow';

export type ListBadgeSummary = {
  id: string;
  name: string;
  icon: ListIconId;
  color: ListColorId;
  isSystem: boolean;
  systemKey: WatchStatus | null;
};

export type UserListSummary = {
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
  updatedAt: string;
};

export type PersonListItem = {
  personId: number;
  name: string;
  imageUrl: string | null;
  country: string | null;
  tvmazeUrl: string;
  addedAt: string;
  lists: ListBadgeSummary[];
};

export type UserListsResponse = {
  primaryLists: UserListSummary[];
  customLists: UserListSummary[];
  availableTags: string[];
};

export type ListDetailResponse =
  | { list: UserListSummary & { entityType: 'series' }; items: WatchlistItem[] }
  | { list: UserListSummary & { entityType: 'person' }; items: PersonListItem[] };

export type CreateListInput = {
  name: string;
  description?: string | null;
  entityType: ListEntityType;
  icon: ListIconId;
  color: ListColorId;
  tags?: string[];
};

export type UpdateListInput = {
  name?: string;
  description?: string | null;
  icon?: ListIconId;
  color?: ListColorId;
  tags?: string[];
};

export type UpdateSeriesListsInput = {
  primaryStatus: WatchStatus | null;
  customListIds: string[];
};

export type UpdatePersonListsInput = {
  customListIds: string[];
};
