import dotenv from 'dotenv';

const ENV_VAR_PATTERN = /\$(?:\{([A-Za-z_][A-Za-z0-9_]*)\}|([A-Za-z_][A-Za-z0-9_]*))/g;

export function expandEnvValue(rawValue: string, env: NodeJS.ProcessEnv = process.env): string {
  return rawValue.replace(ENV_VAR_PATTERN, (match, braced?: string, bare?: string) => {
    const key = braced ?? bare ?? '';
    const resolved = env[key];
    return resolved === undefined ? match : resolved;
  });
}

export function loadDotenv(): void {
  const result = dotenv.config();
  const parsed = result.parsed;
  if (!parsed) return;
  for (const key of Object.keys(parsed)) {
    const current = process.env[key];
    if (current !== undefined) {
      process.env[key] = expandEnvValue(current, process.env);
    }
  }
}
