import { Request } from 'express';

/**
 * Shape of the principal attached to the request by the auth guards.
 * JWT auth populates `sub`/`email`/`role`; API-key auth populates
 * `sub`/`organizationId`/`apiKeyId`/`scopes`. All fields are optional so a single
 * type can describe both flows.
 */
export interface AuthUser {
  userId?: string;
  sub?: string;
  email?: string;
  role?: string;
  organizationId?: string;
  apiKeyId?: string;
  scopes?: string[];
}

/**
 * Express request augmented with the fields our guards and middleware
 * attach downstream. Use this instead of `any` when reading `req.user`
 * or the correlation id.
 */
export interface AuthenticatedRequest extends Request {
  user?: AuthUser;
  correlationId?: string;
}
