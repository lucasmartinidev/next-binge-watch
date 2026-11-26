type LogLevel = 'info' | 'warn' | 'error';

export type LogContext = Record<string, unknown>;

function formatLogEntry(level: LogLevel, message: string, context?: LogContext): string {
  return JSON.stringify({
    timestamp: new Date().toISOString(),
    level,
    message,
    ...context,
  });
}

function serializeError(error: unknown): LogContext {
  if (error instanceof Error) {
    return { errorMessage: error.message };
  }
  if (error !== undefined) {
    return { errorValue: String(error) };
  }
  return {};
}

export const logger = {
  info(message: string, context?: LogContext): void {
    console.log(formatLogEntry('info', message, context));
  },
  warn(message: string, context?: LogContext): void {
    console.log(formatLogEntry('warn', message, context));
  },
  error(message: string, error?: unknown, context?: LogContext): void {
    const errorContext = serializeError(error);
    console.error(formatLogEntry('error', message, { ...errorContext, ...context }));
  },
};
