import { apiRequest } from './apiClient';
import type { Locale } from '@/types/locale';
import type { SearchResponse, SearchScope } from '@/types/search';

export function searchCatalog(input: {
  query: string;
  type: SearchScope;
  locale: Locale;
  signal?: AbortSignal;
}): Promise<SearchResponse> {
  const params = new URLSearchParams({ q: input.query, type: input.type });
  return apiRequest<SearchResponse>(`/api/search?${params.toString()}`, {
    locale: input.locale,
    signal: input.signal,
  });
}
