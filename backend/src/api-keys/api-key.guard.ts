import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { ApiKeysService } from './api-keys.service';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private apiKeysService: ApiKeysService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const rawKey: string | undefined = request.headers['x-api-key'];

    if (!rawKey) throw new UnauthorizedException('API key required');

    const record = await this.apiKeysService.findByHash(rawKey);
    if (!record || !(await this.apiKeysService.isValid(record))) {
      throw new UnauthorizedException('Invalid or expired API key');
    }

    await this.apiKeysService.touchLastUsed(record.id);

    request.user = {
      sub: record.organizationId,
      organizationId: record.organizationId,
      apiKeyId: record.id,
    };

    return true;
  }
}
