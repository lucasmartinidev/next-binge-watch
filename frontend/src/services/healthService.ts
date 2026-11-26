import { apiRequest } from './apiClient';
import type { HealthResponse } from '@/types/health';

export async function checkApiHealth(signal?: AbortSignal): Promise<boolean> {
  try {
    const data = await apiRequest<HealthResponse>('/health', { signal });
    return data.status === 'healthy';
  } catch {
    return false;
  }
}
