import { Module } from '@nestjs/common';
import { ApiKeysService } from './api-keys.service';
import { ApiKeysController } from './api-keys.controller';
import { ApiKeyGuard } from './api-key.guard';
import { ScopeGuard } from './scopes/scope.guard';
import { PrismaModule } from '../prisma/prisma.module';
import { TenantModule } from '../tenant/tenant.module';

@Module({
  imports: [PrismaModule, TenantModule],
  controllers: [ApiKeysController],
  providers: [ApiKeysService, ApiKeyGuard, ScopeGuard],
  exports: [ApiKeysService, ApiKeyGuard, ScopeGuard],
})
export class ApiKeysModule {}
