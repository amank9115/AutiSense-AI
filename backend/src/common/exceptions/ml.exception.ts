import { HttpStatus } from '@nestjs/common';
import { AppException, ErrorCode } from './app.exception';

export class MLServiceUnavailableException extends AppException {
  constructor(message?: string, context?: any) {
    super(
      message || 'ML service is unavailable',
      HttpStatus.SERVICE_UNAVAILABLE,
      ErrorCode.ML_SERVICE_UNAVAILABLE,
      context,
    );
  }
}

export class MLAnalysisFailedException extends AppException {
  constructor(message?: string, context?: any) {
    super(
      message || 'ML analysis failed',
      HttpStatus.INTERNAL_SERVER_ERROR,
      ErrorCode.ML_ANALYSIS_FAILED,
      context,
    );
  }
}

export class MLTimeoutException extends AppException {
  constructor(message?: string, context?: any) {
    super(
      message || 'ML service request timed out',
      HttpStatus.GATEWAY_TIMEOUT,
      ErrorCode.ML_TIMEOUT,
      context,
    );
  }
}
