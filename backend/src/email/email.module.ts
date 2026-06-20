import { Module } from '@nestjs/common';
import { Resend } from 'resend';
import { EmailService, RESEND_CLIENT } from './email.service';
import { AppConfigService } from '../config/config.service';

@Module({
  providers: [
    EmailService,
    {
      provide: RESEND_CLIENT,
      inject: [AppConfigService],
      useFactory: (config: AppConfigService) =>
        new Resend(config.email.resendApiKey || 're_mock_key_for_dev'),
    },
  ],
  exports: [EmailService],
})
export class EmailModule {}
