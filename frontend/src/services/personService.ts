import { apiRequest } from './apiClient';
import type { Locale } from '@/types/locale';
import type { PersonProfile } from '@/types/person';

export function getPersonProfile(input: {
  id: number;
  locale: Locale;
  signal?: AbortSignal;
}): Promise<PersonProfile> {
  return apiRequest<PersonProfile>(`/api/people/${input.id}`, {
    locale: input.locale,
    signal: input.signal,
  });
}
