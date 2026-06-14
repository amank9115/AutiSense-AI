import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { AppException, ErrorCode } from '../exceptions';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    let errorResponse: {
      statusCode: number;
      message: string;
      errorCode: ErrorCode;
      timestamp: string;
      path: string;
      method: string;
      context?: unknown;
    };

    if (exception instanceof AppException) {
      // Handle custom AppException
      errorResponse = {
        statusCode: status,
        message: exception.message,
        errorCode: exception.errorCode,
        timestamp: new Date().toISOString(),
        path: request.url,
        method: request.method,
        ...(exception.context && { context: exception.context }),
      };
    } else if (exception instanceof HttpException) {
      // Handle built-in NestJS HttpException
      const exceptionResponse = exception.getResponse();
      const message =
        typeof exceptionResponse === 'string'
          ? exceptionResponse
          : (exceptionResponse as { message?: string }).message ||
            exception.message;

      errorResponse = {
        statusCode: status,
        message,
        errorCode: ErrorCode.INTERNAL_SERVER_ERROR,
        timestamp: new Date().toISOString(),
        path: request.url,
        method: request.method,
      };
    } else {
      // Handle unknown exceptions
      errorResponse = {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Internal server error',
        errorCode: ErrorCode.INTERNAL_SERVER_ERROR,
        timestamp: new Date().toISOString(),
        path: request.url,
        method: request.method,
      };
    }

    // Log exceptions based on status code
    if (status >= 500) {
      this.logger.error(
        `${request.method} ${request.url} - ${status}`,
        exception instanceof Error ? exception.stack : '',
      );
    } else if (status >= 400) {
      this.logger.warn(`${request.method} ${request.url} - ${status}`);
    }

    response.status(status).json(errorResponse);
  }
}
