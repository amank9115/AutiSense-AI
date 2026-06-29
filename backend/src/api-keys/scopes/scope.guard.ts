import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ApiScope, SCOPE_DESCRIPTIONS } from './scopes.enum';
import { SCOPES_KEY } from './require-scope.decorator';

@Injectable()
export class ScopeGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredScopes = this.reflector.getAllAndOverride<ApiScope[]>(
      SCOPES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredScopes || requiredScopes.length === 0) {
      return true; // No scopes required
    }

    const request = context.switchToHttp().getRequest();
    const userScopes = request.user?.scopes as string[] | undefined;

    if (!userScopes || userScopes.length === 0) {
      throw new ForbiddenException({
        message: 'API key has no scopes assigned',
        requiredScopes,
      });
    }

    const missingScopes = requiredScopes.filter(
      (scope) => !userScopes.includes(scope),
    );

    if (missingScopes.length > 0) {
      throw new ForbiddenException({
        message: 'Insufficient scope permissions',
        requiredScopes,
        missingScopes,
        descriptions: missingScopes.reduce(
          (acc, s) => ({ ...acc, [s]: SCOPE_DESCRIPTIONS[s] }),
          {},
        ),
      });
    }

    return true;
  }
}
