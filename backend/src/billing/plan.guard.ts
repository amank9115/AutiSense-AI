import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { UsageService } from './usage.service';
import { AuthenticatedRequest } from '../common/types/authenticated-request';

@Injectable()
export class PlanGuard implements CanActivate {
  constructor(private usageService: UsageService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const organizationId: string | undefined = request.user?.organizationId;

    if (!organizationId) return true;

    const allowed = await this.usageService.canCreateScreening(organizationId);
    if (!allowed) {
      throw new HttpException(
        {
          statusCode: HttpStatus.PAYMENT_REQUIRED,
          message:
            'Monthly screening quota exceeded. Please upgrade your plan.',
          errorCode: 'PLAN_LIMIT_EXCEEDED',
        },
        HttpStatus.PAYMENT_REQUIRED,
      );
    }
    return true;
  }
}
