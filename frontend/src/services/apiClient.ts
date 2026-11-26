import { ApiClientError, type ApiErrorResponse } from '@/types/api';
import type { Locale } from '@/types/locale';

const BASE_URL = (import.meta.env.VITE_API_URL ?? '').replace(/\/+$/, '');
const HTTP_NO_CONTENT = 204;

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  locale?: Locale;
  body?: unknown;
  signal?: AbortSignal;
};

function buildUrl(path: string, locale?: Locale): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  if (!locale) {
    return `${BASE_URL}${normalizedPath}`;
  }
  const separator = normalizedPath.includes('?') ? '&' : '?';
  return `${BASE_URL}${normalizedPath}${separator}lang=${encodeURIComponent(locale)}`;
}

async function parseError(response: Response): Promise<ApiClientError> {
  const payload = await response.json().catch(() => null) as Partial<ApiErrorResponse> | null;
  if (payload?.error?.code && payload?.error?.message) {
    return new ApiClientError(response.status, payload.error.code, payload.error.message);
  }
  return new ApiClientError(response.status, 'INTERNAL_ERROR', `HTTP ${response.status}`);
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const url = buildUrl(path, options.locale);
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (options.body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }
  const response = await fetch(url, {
    method: options.method ?? 'GET',
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    signal: options.signal,
  });
  if (!response.ok) {
    throw await parseError(response);
  }
  if (response.status === HTTP_NO_CONTENT) {
    return undefined as T;
  }
  return (await response.json()) as T;
}
