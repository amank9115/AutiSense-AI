import { Injectable, LoggerService as NestLoggerService } from '@nestjs/common';
import * as winston from 'winston';

@Injectable()
export class LoggerService implements NestLoggerService {
  private logger: winston.Logger;

  constructor(winstonLogger: winston.Logger) {
    this.logger = winstonLogger;
  }

  setContext(_context: string) {
    // This method is called by NestJS logger interface, but we don't use it
  }

  debug(message: string, context?: string): void {
    this.logger.debug(message, {
      context,
      timestamp: new Date().toISOString(),
    });
  }

  error(message: string, error?: any, context?: string): void {
    let stack: string | undefined;
    let errorMessage = message;

    if (error) {
      if (error instanceof Error) {
        errorMessage = error.message;
        stack = error.stack;
      } else if (typeof error === 'string') {
        errorMessage = error;
      } else {
        errorMessage = JSON.stringify(error);
      }
    }

    this.logger.error(errorMessage, {
      context,
      stack,
      timestamp: new Date().toISOString(),
    });
  }

  log(message: string, context?: string): void {
    this.logger.info(message, { context, timestamp: new Date().toISOString() });
  }

  warn(message: string, context?: string): void {
    this.logger.warn(message, { context, timestamp: new Date().toISOString() });
  }

  verbose(message: string, context?: string): void {
    this.logger.verbose(message, {
      context,
      timestamp: new Date().toISOString(),
    });
  }

  // Additional helper methods
  info(message: string, context?: string): void {
    this.log(message, context);
  }
}
