import { HttpStatus } from '@nestjs/common';
import { AppException, ErrorCode } from './app.exception';

export class NotFoundException extends AppException {
  constructor(message: string, context?: any) {
    super(
      message || 'Resource not found',
      HttpStatus.NOT_FOUND,
      ErrorCode.NOT_FOUND,
      context,
    );
  }
}

export class ResourceConflictException extends AppException {
  constructor(message?: string, context?: any) {
    super(
      message || 'Resource conflict',
      HttpStatus.CONFLICT,
      ErrorCode.RESOURCE_CONFLICT,
      context,
    );
  }
}

export class AlreadyExistsException extends AppException {
  constructor(message?: string, context?: any) {
    super(
      message || 'Resource already exists',
      HttpStatus.CONFLICT,
      ErrorCode.ALREADY_EXISTS,
      context,
    );
  }
}
