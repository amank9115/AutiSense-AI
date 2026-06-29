import {
  CanActivate,
  ExecutionContext,
  Injectable,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { TenantService } from './tenant.service';
import { ForbiddenException, ValidationException } from '../common/exceptions';

/**
 * Marks a route as requiring the `owner` role within the organization
 * identified by the `:orgId` route param. Without it, any member passes.
 */
export const ORG_OWNER_ONLY = 'orgOwnerOnly';
export const OrgOwnerOnly = () => SetMetadata(ORG_OWNER_ONLY, true);

/**
 * Ensures the authenticated user is a member of the organization named by the
 * `:orgId` route param. Must run after JwtAuthGuard so `req.user.sub` is set.
 */
@Injectable()
export class OrgMembershipGuard implements CanActivate {
  constructor(
    private readonly tenantService: TenantService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<{
      user?: { sub?: string };
      params?: Record<string, string>;
    }>();

    const userId = request.user?.sub;
    const orgId = request.params?.orgId;

    if (!userId) {
      throw new ForbiddenException('Authenticated user required');
    }
    if (!orgId) {
      throw new ValidationException('Organization id is required');
    }

    const membership = await this.tenantService.getMember(orgId, userId);
    if (!membership) {
      throw new ForbiddenException(
        'You do not have access to this organization',
      );
    }

    const ownerOnly = this.reflector.getAllAndOverride<boolean>(
      ORG_OWNER_ONLY,
      [context.getHandler(), context.getClass()],
    );
    if (ownerOnly && membership.role !== 'owner') {
      throw new ForbiddenException(
        'This action requires organization owner privileges',
      );
    }

    return true;
  }
}
