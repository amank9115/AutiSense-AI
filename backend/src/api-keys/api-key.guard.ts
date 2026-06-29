import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiKeysService } from './api-keys.service';
import { AuthenticatedRequest } from '../common/types/authenticated-request';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private apiKeysService: ApiKeysService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const rawKey = request.header('x-api-key');

    if (!rawKey) throw new UnauthorizedException('API key required');

    const record = await this.apiKeysService.findByHash(rawKey);
    if (!record || !this.apiKeysService.isValid(record)) {
      throw new UnauthorizedException('Invalid or expired API key');
    }

    await this.apiKeysService.touchLastUsed(record.id);

    // Include scopes from API key
    request.user = {
      sub: record.organizationId,
      organizationId: record.organizationId,
      apiKeyId: record.id,
      scopes: record.scopes as string[],
    };

    return true;
  }
}
