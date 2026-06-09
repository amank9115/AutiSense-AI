import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { LoggerService } from './logger.service';

@Injectable()
export class HttpLoggerMiddleware implements NestMiddleware {
  constructor(private logger: LoggerService) {}

  use(req: Request, res: Response, next: NextFunction): void {
    const startTime = Date.now();
    const { method, path, query, body } = req;

    // Log incoming request
    const sanitizedBody = this.sanitizeBody(body);

    this.logger.debug(`Incoming ${method} ${path}`, 'HTTP');

    // Capture response
    const originalSend = res.send;
    const logger = this.logger;

    res.send = function (data: any) {
      const duration = Date.now() - startTime;
      const statusCode = res.statusCode;

      if (statusCode >= 400) {
        logger.warn(
          `${method} ${path} ${statusCode} - ${duration}ms`,
          'HTTP',
        );
      } else if (duration > 1000) {
        logger.warn(
          `Slow request: ${method} ${path} ${statusCode} - ${duration}ms`,
          'HTTP',
        );
      } else {
        logger.debug(
          `${method} ${path} ${statusCode} - ${duration}ms`,
          'HTTP',
        );
      }

      return originalSend.call(this, data);
    };

    next();
  }

  private sanitizeBody(body: any): any {
    if (!body || typeof body !== 'object') {
      return body;
    }

    const sanitized = { ...body };
    const sensitiveFields = ['password', 'token', 'authorization', 'secret', 'apiKey', 'api_key', 'refreshToken'];

    for (const field of sensitiveFields) {
      if (field in sanitized) {
        sanitized[field] = '***REDACTED***';
      }
    }

    return sanitized;
  }
}
