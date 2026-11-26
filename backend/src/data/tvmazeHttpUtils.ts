const DEFAULT_RETRY_DELAY_MS = 1000;
const MAX_RETRY_DELAY_MS = 1500;

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function getRetryDelayMs(response: Response): number {
  const retryAfter = response.headers.get('retry-after');
  const seconds = retryAfter ? Number(retryAfter) : NaN;
  if (!Number.isNaN(seconds) && seconds > 0) {
    return Math.min(seconds * 1000, MAX_RETRY_DELAY_MS);
  }
  return DEFAULT_RETRY_DELAY_MS;
}

export function isTimeoutError(error: unknown): boolean {
  return (
    error instanceof Error &&
    (error.name === 'TimeoutError' || error.name === 'AbortError')
  );
}
