import { HttpException, HttpStatus } from '@nestjs/common';

export enum ErrorCode {
  // Validation
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_INPUT = 'INVALID_INPUT',
  FILE_INVALID = 'FILE_INVALID',

  // Authentication
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  UNAUTHORIZED = 'UNAUTHORIZED',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  TOKEN_INVALID = 'TOKEN_INVALID',
  TOKEN_REVOKED = 'TOKEN_REVOKED',
  ACCOUNT_LOCKED = 'ACCOUNT_LOCKED',

  // Authorization
  FORBIDDEN = 'FORBIDDEN',
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',

  // Resource
  NOT_FOUND = 'NOT_FOUND',
  RESOURCE_CONFLICT = 'RESOURCE_CONFLICT',
  ALREADY_EXISTS = 'ALREADY_EXISTS',

  // ML Service
  ML_SERVICE_UNAVAILABLE = 'ML_SERVICE_UNAVAILABLE',
  ML_ANALYSIS_FAILED = 'ML_ANALYSIS_FAILED',
  ML_TIMEOUT = 'ML_TIMEOUT',

  // AI Engine
  AI_SERVICE_UNAVAILABLE = 'AI_SERVICE_UNAVAILABLE',
  AI_PROCESSING_FAILED = 'AI_PROCESSING_FAILED',

  // Database
  DATABASE_ERROR = 'DATABASE_ERROR',
  OPERATION_FAILED = 'OPERATION_FAILED',

  // Rate Limiting
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',

  // Internal
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
}

export interface ErrorResponse {
  statusCode: number;
  message: string;
  errorCode: ErrorCode;
  timestamp: string;
  path?: string;
  context?: any;
}

export class AppException extends HttpException {
  constructor(
    message: string,
    statusCode: HttpStatus,
    public readonly errorCode: ErrorCode,
    public readonly context?: any,
  ) {
    super(message, statusCode);
    Error.captureStackTrace(this, this.constructor);
  }

  getResponse(): ErrorResponse {
    return {
      statusCode: this.getStatus(),
      message: this.message,
      errorCode: this.errorCode,
      timestamp: new Date().toISOString(),
      context: this.context,
    };
  }
}
