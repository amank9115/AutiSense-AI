import { HttpStatus } from '@nestjs/common';
import { AppException, ErrorCode } from './app.exception';

export class ForbiddenException extends AppException {
  constructor(message?: string, context?: any) {
    super(
      message || 'Forbidden',
      HttpStatus.FORBIDDEN,
      ErrorCode.FORBIDDEN,
      context,
    );
  }
}

export class InsufficientPermissionsException extends AppException {
  constructor(message?: string, context?: any) {
    super(
      message || 'Insufficient permissions',
      HttpStatus.FORBIDDEN,
      ErrorCode.INSUFFICIENT_PERMISSIONS,
      context,
    );
  }
}
