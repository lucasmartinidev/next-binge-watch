import { useEffect, useState } from 'react';
import { checkApiHealth } from '@/services/healthService';
import type { ApiStatus } from '@/types/health';

const HEALTH_POLL_INTERVAL_MS = 5000;

export function useApiHealth(): ApiStatus {
  const [status, setStatus] = useState<ApiStatus>('checking');
  useEffect(() => {
    let active = true;
    const poll = async () => {
      const healthy = await checkApiHealth();
      if (active) {
        setStatus(healthy ? 'online' : 'offline');
      }
    };
    void poll();
    const timer = setInterval(() => void poll(), HEALTH_POLL_INTERVAL_MS);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, []);
  return status;
}
