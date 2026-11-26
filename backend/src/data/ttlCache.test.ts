import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TtlCache } from './ttlCache';

describe('TtlCache', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-11-24T12:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('stores and retrieves values before TTL expires', () => {
    const cache = new TtlCache();
    cache.set('k1', { ok: true }, 1000);
    expect(cache.get<{ ok: boolean }>('k1')).toEqual({ ok: true });
    vi.advanceTimersByTime(1001);
    expect(cache.get('k1')).toBeUndefined();
  });

  it('evicts oldest entry when max capacity is reached and supports clear', () => {
    const cache = new TtlCache(2);
    cache.set('a', 1, 5000);
    cache.set('b', 2, 5000);
    cache.set('c', 3, 5000);
    expect(cache.get('a')).toBeUndefined();
    expect(cache.get('b')).toBe(2);
    expect(cache.get('c')).toBe(3);
    cache.clear();
    expect(cache.get('b')).toBeUndefined();
  });
});
