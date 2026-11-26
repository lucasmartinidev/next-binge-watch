import type { NextFunction, Request, Response } from 'express';
import { logger } from '../config/logger';
import { getErrorMessage, resolveLocale } from '../i18n/messages';
import { AppError, type ApiErrorResponse } from '../types/error';
import type { Locale } from '../types/locale';

const HTTP_INTERNAL_ERROR = 500;

type ErrorReply = {
  status: number;
  body: ApiErrorResponse;
};

export function extractRequestLocale(req: Request): Locale {
  const langQuery = typeof req.query.lang === 'string' ? req.query.lang : undefined;
  const acceptLanguage = req.header('accept-language');
  return resolveLocale(langQuery, acceptLanguage);
}

function buildErrorReply(err: unknown, locale: Locale): ErrorReply {
  if (err instanceof AppError) {
    const message = getErrorMessage(err.messageKey, locale);
    return { status: err.statusCode, body: { error: { code: err.code, message } } };
  }
  const message = getErrorMessage('internal.error', locale);
  return { status: HTTP_INTERNAL_ERROR, body: { error: { code: 'INTERNAL_ERROR', message } } };
}

function logRequestError(err: unknown, route: string): void {
  if (!(err instanceof AppError)) {
    logger.error('Unhandled server error', err, { route });
    return;
  }
  if (err.statusCode >= HTTP_INTERNAL_ERROR) {
    logger.error('Application error', err.cause ?? err, { route, code: err.code });
    return;
  }
  logger.warn('Request error', { route, code: err.code, statusCode: err.statusCode });
}

export function errorMiddleware(err: unknown, req: Request, res: Response, _next: NextFunction): void {
  logRequestError(err, req.path);
  const reply = buildErrorReply(err, extractRequestLocale(req));
  res.status(reply.status).json(reply.body);
}
