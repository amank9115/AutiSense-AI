import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { DEPRECATED_KEY, DeprecationInfo } from './deprecated.decorator';
import { DEPRECATED_HEADER, SUNSET_HEADER } from './version.middleware';

@Injectable()
export class DeprecationInterceptor implements NestInterceptor {
  constructor(private reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const deprecationInfo = this.reflector.getAllAndOverride<DeprecationInfo>(
      DEPRECATED_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (deprecationInfo?.deprecated) {
      const response = context.switchToHttp().getResponse();

      let headerValue = 'true';
      if (deprecationInfo.message) {
        headerValue = `true; message="${deprecationInfo.message}"`;
      }
      response.setHeader(DEPRECATED_HEADER, headerValue);

      if (deprecationInfo.sunsetDate) {
        response.setHeader(SUNSET_HEADER, deprecationInfo.sunsetDate);
      }
    }

    return next.handle();
  }
}
