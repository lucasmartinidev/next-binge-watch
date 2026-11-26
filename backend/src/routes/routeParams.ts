import { AppError, type MessageKey } from '../types/error';

export function parsePositiveIntParam(
  raw: string | undefined,
  messageKey: MessageKey = 'common.invalidId',
): number {
  if (!raw || !/^\d+$/.test(raw)) {
    throw new AppError('VALIDATION_ERROR', messageKey);
  }
  const parsed = Number(raw);
  if (!Number.isSafeInteger(parsed) || parsed <= 0) {
    throw new AppError('VALIDATION_ERROR', messageKey);
  }
  return parsed;
}

export function parseNonNegativeIntParam(
  raw: string | undefined,
  messageKey: MessageKey,
): number {
  if (!raw || !/^\d+$/.test(raw)) {
    throw new AppError('VALIDATION_ERROR', messageKey);
  }
  const parsed = Number(raw);
  if (!Number.isSafeInteger(parsed) || parsed < 0) {
    throw new AppError('VALIDATION_ERROR', messageKey);
  }
  return parsed;
}
