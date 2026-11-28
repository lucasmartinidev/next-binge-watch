import { useCallback } from 'react';
import { getListDetail, removeListItem, updateList } from '@/services/listService';
import type { ListDetailResponse, PersonListItem, UpdateListPayload, UserListSummary } from '@/types/list';
import type { WatchlistItem } from '@/types/watchlist';
import { useAsyncResource } from './useAsyncResource';
import { useI18n } from './useI18n';

type SeriesDetail = { list: UserListSummary & { entityType: 'series' }; items: WatchlistItem[] };
type PersonDetail = { list: UserListSummary & { entityType: 'person' }; items: PersonListItem[] };

function isSeriesDetail(detail: ListDetailResponse): detail is SeriesDetail {
  return detail.list.entityType === 'series';
}

function dropDetailItem(prev: ListDetailResponse, itemId: number): ListDetailResponse {
  const nextCount = Math.max(0, prev.list.itemCount - 1);
  if (isSeriesDetail(prev)) {
    return { list: { ...prev.list, itemCount: nextCount }, items: prev.items.filter((item) => item.seriesId !== itemId) };
  }
  const personDetail = prev as PersonDetail;
  return { list: { ...personDetail.list, itemCount: nextCount }, items: personDetail.items.filter((item) => item.personId !== itemId) };
}

function patchDetailMeta(prev: ListDetailResponse, updated: UserListSummary): ListDetailResponse {
  if (isSeriesDetail(prev) && updated.entityType === 'series') {
    return { list: { ...updated, entityType: 'series' }, items: prev.items };
  }
  if (!isSeriesDetail(prev) && updated.entityType === 'person') {
    return { list: { ...updated, entityType: 'person' }, items: prev.items };
  }
  return prev;
}

export function useListDetail(listId: string) {
  const { locale } = useI18n();
  const loader = useCallback((signal?: AbortSignal) => getListDetail({ listId, locale, signal }), [listId, locale]);
  const resource = useAsyncResource(loader, Boolean(listId));
  const { setData } = resource;
  const removeItem = useCallback(async (itemId: number) => {
    await removeListItem(listId, itemId, locale);
    setData((prev) => (prev ? dropDetailItem(prev, itemId) : prev));
  }, [listId, locale, setData]);
  const updateMeta = useCallback(async (input: UpdateListPayload) => {
    const updated = await updateList(listId, input, locale);
    setData((prev) => (prev ? patchDetailMeta(prev, updated) : prev));
    return updated;
  }, [listId, locale, setData]);
  const data = resource.data;
  return {
    list: data?.list ?? null,
    seriesItems: data && isSeriesDetail(data) ? data.items : [],
    personItems: data && !isSeriesDetail(data) ? data.items : [],
    loading: resource.loading,
    error: resource.error,
    retry: resource.retry,
    removeItem,
    updateMeta,
  };
}
