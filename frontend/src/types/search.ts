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
};

export type SearchResponse = {
  query: string;
  type: SearchScope;
  locale: Locale;
  total: number;
  items: SearchResultItem[];
};
