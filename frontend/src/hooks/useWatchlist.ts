import { useCallback, useState } from 'react';
import { getWatchlist, removeFromWatchlist, updateWatchStatus } from '@/services/watchlistService';
import type { WatchStatus, WatchlistFilter } from '@/types/watchlist';
import { useAsyncResource } from './useAsyncResource';
import { useI18n } from './useI18n';
import { dropItem, replaceOrDropItem } from './watchlistStateHelpers';

export function useWatchlist() {
  const { locale } = useI18n();
  const [filter, setFilter] = useState<WatchlistFilter>('all');
  const loader = useCallback(
    (signal?: AbortSignal) => getWatchlist({ status: filter, locale, signal }),
    [filter, locale],
  );
  const resource = useAsyncResource(loader);
  const { setData } = resource;
  const changeStatus = useCallback(async (seriesId: number, status: WatchStatus) => {
    const updated = await updateWatchStatus({ seriesId, status, locale });
    setData((prev) => (prev ? { ...prev, items: replaceOrDropItem(prev.items, updated, filter) } : prev));
  }, [filter, locale, setData]);
  const remove = useCallback(async (seriesId: number) => {
    await removeFromWatchlist(seriesId, locale);
    setData((prev) => (prev ? { ...prev, items: dropItem(prev.items, seriesId) } : prev));
  }, [locale, setData]);
  return {
    filter,
    setFilter,
    items: resource.data?.items ?? [],
    loading: resource.loading,
    error: resource.error,
    retry: resource.retry,
    changeStatus,
    remove,
  };
}
