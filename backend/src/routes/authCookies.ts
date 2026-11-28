import type { Request, Response } from 'express';

export const SESSION_COOKIE_NAME = 'nbw_session';

export function parseSessionCookie(req: Request): string | null {
  const rawCookie = req.headers.cookie;
  if (!rawCookie) return null;
  for (const part of rawCookie.split(';')) {
    const trimmed = part.trim();
    if (trimmed.startsWith(`${SESSION_COOKIE_NAME}=`)) {
      const value = trimmed.slice(SESSION_COOKIE_NAME.length + 1).trim();
      return value ? decodeURIComponent(value) : null;
    }
  }
  return null;
}

export function setSessionCookie(
  res: Response,
  input: { token: string; maxAgeSeconds: number; isProduction: boolean },
): void {
  const parts = [
    `${SESSION_COOKIE_NAME}=${encodeURIComponent(input.token)}`,
    'HttpOnly',
    'Path=/',
    'SameSite=Lax',
    `Max-Age=${input.maxAgeSeconds}`,
  ];
  if (input.isProduction) parts.push('Secure');
  res.setHeader('Set-Cookie', parts.join('; '));
}

export function clearSessionCookie(res: Response, isProduction: boolean): void {
  const parts = [`${SESSION_COOKIE_NAME}=`, 'HttpOnly', 'Path=/', 'SameSite=Lax', 'Max-Age=0'];
  if (isProduction) parts.push('Secure');
  res.setHeader('Set-Cookie', parts.join('; '));
}
