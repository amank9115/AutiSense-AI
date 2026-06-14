import { HttpStatus } from '@nestjs/common';
import { AppException, ErrorCode } from './app.exception';

export class AuthException extends AppException {
  constructor(message: string, context?: any) {
    super(
      message || 'Authentication failed',
      HttpStatus.UNAUTHORIZED,
      ErrorCode.UNAUTHORIZED,
      context,
    );
  }
}

export class InvalidCredentialsException extends AppException {
  constructor(message?: string) {
    super(
      message || 'Invalid email or password',
      HttpStatus.UNAUTHORIZED,
      ErrorCode.INVALID_CREDENTIALS,
    );
  }
}

export class TokenExpiredException extends AppException {
  constructor(message?: string) {
    super(
      message || 'Token has expired',
      HttpStatus.UNAUTHORIZED,
      ErrorCode.TOKEN_EXPIRED,
    );
  }
}

export class TokenInvalidException extends AppException {
  constructor(message?: string) {
    super(
      message || 'Invalid token',
      HttpStatus.UNAUTHORIZED,
      ErrorCode.TOKEN_INVALID,
    );
  }
}

export class TokenRevokedException extends AppException {
  constructor(message?: string) {
    super(
      message || 'Token has been revoked',
      HttpStatus.UNAUTHORIZED,
      ErrorCode.TOKEN_REVOKED,
    );
  }
}

export class AccountLockedException extends AppException {
  constructor(message?: string) {
    super(
      message ||
        'Account is temporarily locked due to too many failed attempts',
      423, // Locked
      ErrorCode.ACCOUNT_LOCKED,
    );
  }
}
