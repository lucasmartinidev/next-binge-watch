import { describe, expect, it, vi } from 'vitest';
import { logger } from './logger';

describe('logger', () => {
  it('logs info, warn, and error with Error, primitive, and undefined values', () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    logger.info('Server started', { port: 3000 });
    logger.warn('Rate limited', { route: '/api/search' });
    logger.error('Failed with Error', new Error('boom'), { route: '/api/series' });
    logger.error('Failed with string', 'raw failure');
    logger.error('Failed without error object');
    expect(logSpy).toHaveBeenCalledTimes(2);
    expect(errorSpy).toHaveBeenCalledTimes(3);
    logSpy.mockRestore();
    errorSpy.mockRestore();
  });
});
