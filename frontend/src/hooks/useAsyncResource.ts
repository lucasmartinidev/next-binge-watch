import { useCallback, useEffect, useState, type Dispatch, type SetStateAction } from 'react';
import { isAbortError, toErrorMessage } from './asyncErrors';
import { useI18n } from './useI18n';

export type AsyncLoader<T> = (signal?: AbortSignal) => Promise<T>;

export type AsyncResource<T> = {
  data: T | null;
  setData: Dispatch<SetStateAction<T | null>>;
  loading: boolean;
  error: string | null;
  setError: Dispatch<SetStateAction<string | null>>;
  retry: () => void;
};

export function useAsyncResource<T>(loader: AsyncLoader<T>, enabled = true): AsyncResource<T> {
  const { t } = useI18n();
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);
  const run = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    setError(null);
    try {
      setData(await loader(signal));
    } catch (err: unknown) {
      if (!isAbortError(err)) {
        setError(toErrorMessage(err, t('genericError')));
      }
    }
    if (!signal?.aborted) {
      setLoading(false);
    }
  }, [loader, t]);
  useEffect(() => {
    if (!enabled) {
      return;
    }
    const controller = new AbortController();
    void run(controller.signal);
    return () => controller.abort();
  }, [run, enabled]);
  const retry = useCallback(() => void run(), [run]);
  return { data, setData, loading: enabled && loading, error, setError, retry };
}
