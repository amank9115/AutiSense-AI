import { SetMetadata } from '@nestjs/common';
import { ApiScope } from './scopes.enum';

export const SCOPES_KEY = 'requiredScopes';

/**
 * Decorator to specify required scopes for an endpoint
 * @param scopes - One or more required scopes (user must have ALL)
 */
export const RequireScopes = (...scopes: ApiScope[]) => SetMetadata(SCOPES_KEY, scopes);
