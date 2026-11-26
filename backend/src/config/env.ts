import 'dotenv/config';

const DEFAULT_PORT = 3000;
const DEFAULT_DATABASE_URL = 'file:./data/next-binge-watch.db';
const DEFAULT_TVMAZE_BASE_URL = 'https://api.tvmaze.com';
const DEFAULT_TVMAZE_TIMEOUT_MS = 5000;
const MIN_PORT = 1;
const MAX_PORT = 65535;

export type AppEnv = {
  port: number;
  databaseUrl: string;
  tvmazeBaseUrl: string;
  tvmazeTimeoutMs: number;
};

function parsePositiveInteger(rawValue: string | undefined, fallback: number, name: string): number {
  if (!rawValue) {
    return fallback;
  }
  const parsed = Number(rawValue);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`${name} must be a positive integer`);
  }
  return parsed;
}

export function loadEnv(): AppEnv {
  const port = parsePositiveInteger(process.env.PORT, DEFAULT_PORT, 'PORT');
  if (port < MIN_PORT || port > MAX_PORT) {
    throw new Error(`PORT must be between ${MIN_PORT} and ${MAX_PORT}`);
  }
  const databaseUrl = process.env.DATABASE_URL?.trim() || DEFAULT_DATABASE_URL;
  const tvmazeBaseUrl = (process.env.TVMAZE_BASE_URL?.trim() || DEFAULT_TVMAZE_BASE_URL).replace(/\/+$/, '');
  const tvmazeTimeoutMs = parsePositiveInteger(
    process.env.TVMAZE_TIMEOUT_MS,
    DEFAULT_TVMAZE_TIMEOUT_MS,
    'TVMAZE_TIMEOUT_MS',
  );
  return {
    port,
    databaseUrl,
    tvmazeBaseUrl,
    tvmazeTimeoutMs,
  };
}
