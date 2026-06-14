import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { AuthenticatedRequest } from '../types/authenticated-request';

export const CORRELATION_ID_HEADER = 'x-correlation-id';

@Injectable()
export class CorrelationIdMiddleware implements NestMiddleware {
  private readonly logger = new Logger(CorrelationIdMiddleware.name);

  use(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
    const correlationId =
      (req.headers[CORRELATION_ID_HEADER] as string) || uuidv4();

    // Attach to request object for downstream use
    req.correlationId = correlationId;

    // Set response header
    res.setHeader(CORRELATION_ID_HEADER, correlationId);

    // Log incoming request with correlation ID
    this.logger.debug(
      `[${correlationId}] ${req.method} ${req.path} - Request started`,
    );

    // Capture response completion
    const startTime = Date.now();
    const originalSend = res.send;

    res.send = function (data: any): Response {
      const duration = Date.now() - startTime;
      const statusCode = res.statusCode;

      const logData = {
        correlationId,
        method: req.method,
        path: req.path,
        statusCode,
        duration,
        userAgent: req.headers['user-agent'],
        ip: req.ip,
      };

      if (statusCode >= 500) {
        logger.error(
          `[${correlationId}] ${req.method} ${req.path} ${statusCode} - ${duration}ms`,
          JSON.stringify(logData),
        );
      } else if (statusCode >= 400) {
        logger.warn(
          `[${correlationId}] ${req.method} ${req.path} ${statusCode} - ${duration}ms`,
        );
      } else if (duration > 1000) {
        logger.warn(
          `[${correlationId}] Slow request: ${req.method} ${req.path} - ${duration}ms`,
        );
      } else {
        logger.debug(
          `[${correlationId}] ${req.method} ${req.path} ${statusCode} - ${duration}ms`,
        );
      }

      return originalSend.call(this, data);
    };

    next();
  }
}

// Logger outside of class for closure
const logger = new Logger('HTTP Response');
