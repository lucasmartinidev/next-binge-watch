import { apiRequest } from './apiClient';
import type { Locale } from '@/types/locale';
import type { NextBingeResponse } from '@/types/recommendation';

export function getNextBinge(input: {
  locale: Locale;
  excludeIds: number[];
  signal?: AbortSignal;
}): Promise<NextBingeResponse> {
  const query = input.excludeIds.length > 0 ? `?excludeIds=${input.excludeIds.join(',')}` : '';
  return apiRequest<NextBingeResponse>(`/api/recommendations/next-binge${query}`, {
    locale: input.locale,
    signal: input.signal,
  });
}
