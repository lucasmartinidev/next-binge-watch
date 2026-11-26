import { useCallback, useState } from 'react';
import { getNextBinge } from '@/services/recommendationService';
import { addToWatchlist } from '@/services/watchlistService';
import type { NextBingeResponse } from '@/types/recommendation';
import { useAsyncResource } from './useAsyncResource';
import { useI18n } from './useI18n';

function markInWatchlist(prev: NextBingeResponse | null): NextBingeResponse | null {
  if (!prev?.recommendation) {
    return prev;
  }
  return { ...prev, recommendation: { ...prev.recommendation, inWatchlist: true } };
}

export function useNextBinge() {
  const { locale } = useI18n();
  const [excludeIds, setExcludeIds] = useState<number[]>([]);
  const loader = useCallback(
    (signal?: AbortSignal) => getNextBinge({ locale, excludeIds, signal }),
    [locale, excludeIds],
  );
  const resource = useAsyncResource(loader);
  const { setData } = resource;
  const recommendation = resource.data?.recommendation ?? null;
  const showAnother = useCallback(() => {
    if (recommendation) {
      setExcludeIds((prev) => [...prev, recommendation.seriesId]);
    }
  }, [recommendation]);
  const addRecommendedToWatchlist = useCallback(async () => {
    if (!recommendation) {
      return;
    }
    await addToWatchlist({ seriesId: recommendation.seriesId, status: 'want_to_watch', locale });
    setData(markInWatchlist);
  }, [recommendation, locale, setData]);
  return {
    recommendation, hasMore: resource.data?.hasMore ?? false, loading: resource.loading,
    error: resource.error, showAnother, addRecommendedToWatchlist, retry: resource.retry,
  };
}
