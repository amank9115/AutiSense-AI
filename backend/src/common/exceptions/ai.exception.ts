import { HttpStatus } from '@nestjs/common';
import { AppException, ErrorCode } from './app.exception';

export class AIServiceUnavailableException extends AppException {
  constructor(message?: string, context?: any) {
    super(
      message || 'AI service is unavailable',
      HttpStatus.SERVICE_UNAVAILABLE,
      ErrorCode.AI_SERVICE_UNAVAILABLE,
      context,
    );
  }
}

export class AIProcessingFailedException extends AppException {
  constructor(message?: string, context?: any) {
    super(
      message || 'AI processing failed',
      HttpStatus.INTERNAL_SERVER_ERROR,
      ErrorCode.AI_PROCESSING_FAILED,
      context,
    );
  }
}
