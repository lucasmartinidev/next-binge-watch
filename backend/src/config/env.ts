import 'dotenv/config';

const DEFAULT_PORT = 3000;
const DEFAULT_TVMAZE_BASE_URL = 'https://api.tvmaze.com';
const DEFAULT_TVMAZE_TIMEOUT_MS = 5000;
const MIN_PORT = 1;
const MAX_PORT = 65535;
const POSTGRES_PROTOCOLS = new Set(['postgres:', 'postgresql:']);

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

function parseDatabaseUrl(rawValue: string | undefined): string {
  const trimmed = rawValue?.trim() ?? '';
  if (!trimmed) {
    throw new Error('DATABASE_URL is required');
  }
  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    throw new Error('DATABASE_URL must be a valid PostgreSQL connection URL');
  }
  if (!POSTGRES_PROTOCOLS.has(parsed.protocol)) {
    throw new Error('DATABASE_URL must use the postgres:// or postgresql:// protocol');
  }
  return trimmed;
}

export function loadEnv(): AppEnv {
  const port = parsePositiveInteger(process.env.PORT, DEFAULT_PORT, 'PORT');
  if (port < MIN_PORT || port > MAX_PORT) {
    throw new Error(`PORT must be between ${MIN_PORT} and ${MAX_PORT}`);
  }
  const databaseUrl = parseDatabaseUrl(process.env.DATABASE_URL);
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
