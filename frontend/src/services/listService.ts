import type {
  CreateListPayload,
  ListDetailResponse,
  ListEntityType,
  UpdateListPayload,
  UpdatePersonListsPayload,
  UpdatePersonListsResponse,
  UpdateSeriesListsPayload,
  UpdateSeriesListsResponse,
  UserListSummary,
  UserListsResponse,
} from '@/types/list';
import type { Locale } from '@/types/locale';
import { apiRequest } from './apiClient';

export function getLists(params: { type?: ListEntityType; tag?: string; locale: Locale; signal?: AbortSignal }): Promise<UserListsResponse> {
  const qs = new URLSearchParams();
  if (params.type) qs.set('type', params.type);
  if (params.tag) qs.set('tag', params.tag);
  const query = qs.toString();
  return apiRequest<UserListsResponse>(`/api/lists${query ? `?${query}` : ''}`, { locale: params.locale, signal: params.signal });
}

export function getListDetail(params: { listId: string; locale: Locale; signal?: AbortSignal }): Promise<ListDetailResponse> {
  return apiRequest<ListDetailResponse>(`/api/lists/${encodeURIComponent(params.listId)}`, {
    locale: params.locale,
    signal: params.signal,
  });
}

export function createList(input: CreateListPayload, locale: Locale): Promise<UserListSummary> {
  return apiRequest<UserListSummary>('/api/lists', { method: 'POST', body: input, locale });
}

export function updateList(listId: string, input: UpdateListPayload, locale: Locale): Promise<UserListSummary> {
  return apiRequest<UserListSummary>(`/api/lists/${encodeURIComponent(listId)}`, { method: 'PATCH', body: input, locale });
}

export function deleteList(listId: string, locale: Locale): Promise<void> {
  return apiRequest<void>(`/api/lists/${encodeURIComponent(listId)}`, { method: 'DELETE', locale });
}

export function removeListItem(listId: string, itemId: number, locale: Locale): Promise<void> {
  return apiRequest<void>(`/api/lists/${encodeURIComponent(listId)}/items/${itemId}`, { method: 'DELETE', locale });
}

export function updateSeriesLists(
  seriesId: number,
  input: UpdateSeriesListsPayload,
  locale: Locale,
): Promise<UpdateSeriesListsResponse> {
  return apiRequest<UpdateSeriesListsResponse>(`/api/series/${seriesId}/lists`, { method: 'PUT', body: input, locale });
}

export function updatePersonLists(
  personId: number,
  input: UpdatePersonListsPayload,
  locale: Locale,
): Promise<UpdatePersonListsResponse> {
  return apiRequest<UpdatePersonListsResponse>(`/api/people/${personId}/lists`, { method: 'PUT', body: input, locale });
}
