import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TtlCache } from './ttlCache';
import { TvmazeClient } from './tvmazeClient';

describe('TvmazeClient (UT-08)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('retries once on HTTP 429 and caches subsequent calls within TTL', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response('', { status: 429, headers: { 'retry-after': '1' } }))
      .mockResolvedValueOnce(
        new Response(JSON.stringify([{ score: 1, show: { id: 169, name: 'Breaking Bad', url: 'u' } }]), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        }),
      );
    const client = new TvmazeClient({
      baseUrl: 'https://api.tvmaze.com',
      timeoutMs: 5000,
      cache: new TtlCache(),
      fetchFn: fetchMock as unknown as typeof fetch,
    });
    const promise = client.searchShows('break');
    await vi.advanceTimersByTimeAsync(1000);
    const first = await promise;
    const second = await client.searchShows('break');
    expect(first).toHaveLength(1);
    expect(second).toHaveLength(1);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('maps repeated 429, timeout, 404, and 5xx responses to expected behavior', async () => {
    const rateLimitFetch = vi.fn().mockResolvedValue(new Response('', { status: 429 }));
    const rateClient = new TvmazeClient({
      baseUrl: 'https://api.tvmaze.com',
      timeoutMs: 5000,
      cache: new TtlCache(),
      fetchFn: rateLimitFetch as unknown as typeof fetch,
    });
    const ratePromise = rateClient.searchPeople('bryan').catch((err: unknown) => err);
    await vi.advanceTimersByTimeAsync(1000);
    await expect(ratePromise).resolves.toMatchObject({ code: 'UPSTREAM_RATE_LIMITED', statusCode: 429 });

    const timeoutError = new Error('Timed out');
    timeoutError.name = 'TimeoutError';
    const timeoutClient = new TvmazeClient({
      baseUrl: 'https://api.tvmaze.com',
      timeoutMs: 5000,
      cache: new TtlCache(),
      fetchFn: vi.fn().mockRejectedValue(timeoutError) as unknown as typeof fetch,
    });
    await expect(timeoutClient.getPerson(1)).rejects.toMatchObject({
      code: 'UPSTREAM_TIMEOUT',
      statusCode: 504,
    });

    const notFoundClient = new TvmazeClient({
      baseUrl: 'https://api.tvmaze.com',
      timeoutMs: 5000,
      cache: new TtlCache(),
      fetchFn: vi.fn().mockResolvedValue(new Response('', { status: 404 })) as unknown as typeof fetch,
    });
    expect(await notFoundClient.getShowWithEmbeds(999)).toBeNull();

    const errorClient = new TvmazeClient({
      baseUrl: 'https://api.tvmaze.com',
      timeoutMs: 5000,
      cache: new TtlCache(),
      fetchFn: vi.fn().mockResolvedValue(new Response('', { status: 500 })) as unknown as typeof fetch,
    });
    await expect(errorClient.getShowsPage(0)).rejects.toMatchObject({
      code: 'UPSTREAM_UNAVAILABLE',
      statusCode: 502,
    });
  });
});
