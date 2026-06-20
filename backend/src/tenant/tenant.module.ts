import { Module } from '@nestjs/common';
import { TenantService } from './tenant.service';
import { TenantController } from './tenant.controller';
import { OrgMembershipGuard } from './org-membership.guard';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [TenantController],
  providers: [TenantService, OrgMembershipGuard],
  exports: [TenantService, OrgMembershipGuard],
})
export class TenantModule {}
