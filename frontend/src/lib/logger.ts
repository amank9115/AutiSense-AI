/**
 * Production-safe logging utility
 * Logs are suppressed in production build unless explicitly enabled
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const isDev = process.env.NODE_ENV === 'development';

function formatMessage(level: LogLevel, context: string): string {
  return `[${level.toUpperCase()}] [${context}]`;
}

export const logger = {
  debug: (context: string, message: string, data?: unknown) => {
    if (isDev) {
      console.debug(formatMessage('debug', context), message, data ?? ''); // eslint-disable-line no-console
    }
  },

  info: (context: string, message: string, data?: unknown) => {
    if (isDev) {
      console.info(formatMessage('info', context), message, data ?? ''); // eslint-disable-line no-console
    }
  },

  warn: (context: string, message: string, data?: unknown) => {
    console.warn(formatMessage('warn', context), message, data ?? ''); // eslint-disable-line no-console
  },

  error: (context: string, message: string, error?: unknown) => {
    console.error(formatMessage('error', context), message, error ?? ''); // eslint-disable-line no-console
  },
};

export default logger;
