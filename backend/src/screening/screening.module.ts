import { Module } from '@nestjs/common';
import { ScreeningController } from './screening.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [PrismaModule, AiModule],
  controllers: [ScreeningController],
})
export class ScreeningModule {}
