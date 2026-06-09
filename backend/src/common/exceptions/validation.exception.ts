import { HttpStatus } from '@nestjs/common';
import { AppException, ErrorCode } from './app.exception';

export class ValidationException extends AppException {
  constructor(message: string, context?: any) {
    super(
      message || 'Validation failed',
      HttpStatus.BAD_REQUEST,
      ErrorCode.VALIDATION_ERROR,
      context,
    );
  }
}

export class InvalidInputException extends AppException {
  constructor(message: string, context?: any) {
    super(
      message || 'Invalid input provided',
      HttpStatus.BAD_REQUEST,
      ErrorCode.INVALID_INPUT,
      context,
    );
  }
}

export class FileInvalidException extends AppException {
  constructor(message: string, context?: any) {
    super(
      message || 'File validation failed',
      HttpStatus.BAD_REQUEST,
      ErrorCode.FILE_INVALID,
      context,
    );
  }
}
