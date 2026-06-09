import { Module } from '@nestjs/common';
import { BillingService } from './billing.service';
import { UsageService } from './usage.service';
import { BillingController } from './billing.controller';
import { PlanGuard } from './plan.guard';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [BillingController],
  providers: [BillingService, UsageService, PlanGuard],
  exports: [BillingService, UsageService, PlanGuard],
})
export class BillingModule {}
