import { useCallback } from 'react';
import { getPersonProfile } from '@/services/personService';
import { useAsyncResource } from './useAsyncResource';
import { useI18n } from './useI18n';

export function usePersonProfile(personId: number) {
  const { locale, t } = useI18n();
  const isValid = Number.isInteger(personId) && personId > 0;
  const loader = useCallback(
    (signal?: AbortSignal) => getPersonProfile({ id: personId, locale, signal }),
    [personId, locale],
  );
  const resource = useAsyncResource(loader, isValid);
  return {
    profile: resource.data,
    loading: resource.loading,
    error: isValid ? resource.error : t('notFoundBody'),
    retry: resource.retry,
  };
}
