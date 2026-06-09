import { IsArray, IsIn, IsUrl } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { WebhookEvent } from '../webhooks.service';

const VALID_EVENTS: WebhookEvent[] = [
  'screening.completed',
  'report.generated',
  'subscription.updated',
  'member.added',
  'member.removed',
];

export class RegisterWebhookDto {
  @ApiProperty({ description: 'HTTPS URL to deliver events to' })
  @IsUrl({ require_tld: false })
  url: string;

  @ApiProperty({ type: [String], enum: VALID_EVENTS, isArray: true })
  @IsArray()
  @IsIn(VALID_EVENTS, { each: true })
  events: WebhookEvent[];
}
