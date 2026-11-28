import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiClientError } from '@/types/api';
import { apiRequest, isUnauthorizedError } from './apiClient';
import { checkApiHealth } from './healthService';

describe('apiClient and healthService', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('appends lang parameter and parses JSON payloads', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), { status: 200 }),
    );
    const result = await apiRequest<{ ok: boolean }>('/api/search?q=test', { locale: 'pt-BR' });
    expect(result).toEqual({ ok: true });
    expect(fetchSpy).toHaveBeenCalledWith(
      '/api/search?q=test&lang=pt-BR',
      expect.objectContaining({ method: 'GET', credentials: 'include' }),
    );
    expect(isUnauthorizedError(new ApiClientError(401, 'UNAUTHORIZED', 'no'))).toBe(true);
    expect(isUnauthorizedError(new ApiClientError(403, 'FORBIDDEN', 'no'))).toBe(false);
  });

  it('throws ApiClientError with localized backend message on error responses', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ error: { code: 'NOT_FOUND', message: 'Série não encontrada.' } }), {
        status: 404,
      }),
    );
    await expect(apiRequest('/api/series/999', { locale: 'pt-BR' })).rejects.toMatchObject({
      name: 'ApiClientError',
      status: 404,
      code: 'NOT_FOUND',
      message: 'Série não encontrada.',
    });
    expect(new ApiClientError(400, 'VALIDATION_ERROR', 'bad').code).toBe('VALIDATION_ERROR');
  });

  it('checkApiHealth returns true when healthy and false on network failure', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({ status: 'healthy' }), { status: 200 }),
    );
    expect(await checkApiHealth()).toBe(true);
    vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(new Error('offline'));
    expect(await checkApiHealth()).toBe(false);
  });
});
