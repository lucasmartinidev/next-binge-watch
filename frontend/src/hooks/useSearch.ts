import { useCallback, useState } from 'react';
import { searchCatalog } from '@/services/searchService';
import type { SearchScope } from '@/types/search';
import { useAsyncResource } from './useAsyncResource';
import { useI18n } from './useI18n';

export function useSearch() {
  const { locale, t } = useI18n();
  const [query, setQuery] = useState('');
  const [scope, setScope] = useState<SearchScope>('all');
  const [submittedQuery, setSubmittedQuery] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const loader = useCallback(
    (signal?: AbortSignal) => searchCatalog({ query: submittedQuery, type: scope, locale, signal }),
    [submittedQuery, scope, locale],
  );
  const resource = useAsyncResource(loader, submittedQuery !== '');
  const { setData, setError } = resource;
  const submit = useCallback(() => {
    const trimmed = query.trim();
    setValidationError(trimmed ? null : t('searchValidationEmpty'));
    if (trimmed) setSubmittedQuery(trimmed);
  }, [query, t]);
  const clear = useCallback(() => {
    setQuery('');
    setSubmittedQuery('');
    setValidationError(null);
    setData(null);
    setError(null);
  }, [setData, setError]);
  return {
    query, setQuery, scope, setScope, submittedQuery, submit, clear,
    data: resource.data, loading: resource.loading, error: validationError ?? resource.error, retry: resource.retry,
  };
}
