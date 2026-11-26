export type ApiStatus = 'checking' | 'online' | 'offline';

export type HealthResponse = {
  status: string;
  timestamp: string;
  database?: string;
};
