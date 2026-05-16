import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ReportProcessor } from './report.processor';
import { MlModule } from '../ml/ml.module';
import { EmailModule } from '../email/email.module';

export const REPORT_QUEUE = 'report';

@Module({
  imports: [
    BullModule.forRoot({
      connection: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379', 10),
      },
    }),
    BullModule.registerQueue({
      name: REPORT_QUEUE,
    }),
    MlModule,
    EmailModule,
  ],
  providers: [ReportProcessor],
  exports: [BullModule],
})
export class QueueModule {}
