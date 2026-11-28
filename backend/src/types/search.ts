import type { ListBadgeSummary } from './list';
import type { Locale } from './locale';

export type SearchScope = 'all' | 'series' | 'person';
export type ContentType = 'series' | 'person';

export type SearchResultItem = {
  id: number;
  contentType: ContentType;
  name: string;
  localizedName: string | null;
  imageUrl: string | null;
  subtitle: string | null;
  status: string | null;
  rating: number | null;
  premieredYear: string | null;
  genres: string[];
  tvmazeUrl: string;
  lists: ListBadgeSummary[];
};

export type SearchResponse = {
  query: string;
  type: SearchScope;
  locale: Locale;
  total: number;
  items: SearchResultItem[];
};
