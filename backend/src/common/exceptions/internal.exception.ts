import { HttpStatus } from '@nestjs/common';
import { AppException, ErrorCode } from './app.exception';

export class InternalServerException extends AppException {
  constructor(message?: string, context?: any) {
    super(
      message || 'Internal server error',
      HttpStatus.INTERNAL_SERVER_ERROR,
      ErrorCode.INTERNAL_SERVER_ERROR,
      context,
    );
  }
}

export class ServiceUnavailableException extends AppException {
  constructor(message?: string, context?: any) {
    super(
      message || 'Service unavailable',
      HttpStatus.SERVICE_UNAVAILABLE,
      ErrorCode.SERVICE_UNAVAILABLE,
      context,
    );
  }
}

export class DatabaseException extends AppException {
  constructor(message?: string, context?: any) {
    super(
      message || 'Database operation failed',
      HttpStatus.INTERNAL_SERVER_ERROR,
      ErrorCode.DATABASE_ERROR,
      context,
    );
  }
}

export class OperationFailedException extends AppException {
  constructor(message?: string, context?: any) {
    super(
      message || 'Operation failed',
      HttpStatus.INTERNAL_SERVER_ERROR,
      ErrorCode.OPERATION_FAILED,
      context,
    );
  }
}
