import { apiRequest } from './apiClient';
import type { Locale } from '@/types/locale';
import type { SeriesProfile } from '@/types/series';

export function getSeriesProfile(input: {
  id: number;
  locale: Locale;
  signal?: AbortSignal;
}): Promise<SeriesProfile> {
  return apiRequest<SeriesProfile>(`/api/series/${input.id}`, {
    locale: input.locale,
    signal: input.signal,
  });
}
