import { logger } from '../config/logger';
import { AppError } from '../types/error';
import type { TtlCache } from './ttlCache';
import { getRetryDelayMs, isTimeoutError, sleep } from './tvmazeHttpUtils';

const HTTP_NOT_FOUND = 404;
const HTTP_RATE_LIMITED = 429;

export type TvmazeHttpOptions = {
  baseUrl: string;
  timeoutMs: number;
  cache: TtlCache;
  fetchFn?: typeof fetch;
};

export class TvmazeHttp {
  private readonly fetchFn: typeof fetch;
  private readonly inFlight = new Map<string, Promise<unknown>>();

  constructor(private readonly options: TvmazeHttpOptions) {
    this.fetchFn = options.fetchFn ?? fetch;
  }

  async getJson<T>(path: string, ttlMs: number, allowNotFound = false): Promise<T | null> {
    const cached = this.options.cache.get<T>(path);
    if (cached !== undefined) {
      return cached;
    }
    const existing = this.inFlight.get(path);
    if (existing) {
      return existing as Promise<T | null>;
    }
    const pending = this.fetchAndCache<T>(path, ttlMs, allowNotFound).finally(() => {
      this.inFlight.delete(path);
    });
    this.inFlight.set(path, pending);
    return pending;
  }

  private async fetchAndCache<T>(path: string, ttlMs: number, allowNotFound: boolean): Promise<T | null> {
    const response = await this.executeWithRetry(`${this.options.baseUrl}${path}`);
    if (response.status === HTTP_NOT_FOUND && allowNotFound) {
      return null;
    }
    if (response.status === HTTP_RATE_LIMITED) {
      throw new AppError('UPSTREAM_RATE_LIMITED', 'upstream.rateLimited');
    }
    if (!response.ok) {
      throw new AppError('UPSTREAM_UNAVAILABLE', 'upstream.unavailable');
    }
    const data = await this.parseJson<T>(response);
    this.options.cache.set(path, data, ttlMs);
    return data;
  }

  private async executeWithRetry(url: string, attempt = 0): Promise<Response> {
    const response = await this.performFetch(url);
    if (response.status === HTTP_RATE_LIMITED && attempt === 0) {
      const delayMs = getRetryDelayMs(response);
      logger.warn('TVmaze rate limit hit; retrying', { url, delayMs });
      await sleep(delayMs);
      return this.executeWithRetry(url, 1);
    }
    return response;
  }

  private async performFetch(url: string): Promise<Response> {
    try {
      return await this.fetchFn(url, {
        signal: AbortSignal.timeout(this.options.timeoutMs),
        headers: { Accept: 'application/json' },
      });
    } catch (error: unknown) {
      if (isTimeoutError(error)) {
        throw new AppError('UPSTREAM_TIMEOUT', 'upstream.timeout', { cause: error });
      }
      throw new AppError('UPSTREAM_UNAVAILABLE', 'upstream.unavailable', { cause: error });
    }
  }

  private async parseJson<T>(response: Response): Promise<T> {
    try {
      return (await response.json()) as T;
    } catch (error: unknown) {
      throw new AppError('UPSTREAM_UNAVAILABLE', 'upstream.unavailable', { cause: error });
    }
  }
}
