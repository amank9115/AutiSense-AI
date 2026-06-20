import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { OrgMembershipGuard } from '../tenant/org-membership.guard';
import { ApiKeysService } from './api-keys.service';
import { CreateApiKeyDto } from './dto/create-api-key.dto';

@Controller('api/v1/api-keys')
@UseGuards(JwtAuthGuard, OrgMembershipGuard)
export class ApiKeysController {
  constructor(private apiKeysService: ApiKeysService) {}

  @Post(':orgId')
  async create(@Param('orgId') orgId: string, @Body() dto: CreateApiKeyDto) {
    const { key, record } = await this.apiKeysService.generate(
      orgId,
      dto.name,
      dto.scopes,
    );
    return {
      ...record,
      key,
      warning: 'Store this key securely — it will not be shown again.',
    };
  }

  @Get(':orgId')
  async list(@Param('orgId') orgId: string) {
    return this.apiKeysService.listForOrg(orgId);
  }

  @Delete(':orgId/:keyId')
  async revoke(@Param('orgId') orgId: string, @Param('keyId') keyId: string) {
    await this.apiKeysService.revoke(keyId, orgId);
    return { message: 'API key revoked' };
  }
}
