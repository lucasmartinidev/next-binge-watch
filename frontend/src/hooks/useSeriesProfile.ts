import { useCallback } from 'react';
import { getSeriesProfile } from '@/services/seriesService';
import { useAsyncResource } from './useAsyncResource';
import { useI18n } from './useI18n';
import { useEpisodeMutations, useWatchStatusMutations } from './useSeriesMutations';

export function useSeriesProfile(seriesId: number) {
  const { locale, t } = useI18n();
  const isValid = Number.isInteger(seriesId) && seriesId > 0;
  const loader = useCallback(
    (signal?: AbortSignal) => getSeriesProfile({ id: seriesId, locale, signal }),
    [seriesId, locale],
  );
  const resource = useAsyncResource(loader, isValid);
  const statusMutations = useWatchStatusMutations(resource.data, resource.setData);
  const episodeMutations = useEpisodeMutations(resource.data, resource.setData);
  return {
    profile: resource.data,
    loading: resource.loading,
    error: isValid ? resource.error : t('notFoundBody'),
    retry: resource.retry,
    ...statusMutations,
    ...episodeMutations,
  };
}
