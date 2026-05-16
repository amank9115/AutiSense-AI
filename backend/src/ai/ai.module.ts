import { Module } from '@nestjs/common';
import { AiService } from './ai.service';
import { AiController } from './ai.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { DocumentProcessor } from './document.processor';

@Module({
  imports: [PrismaModule],
  controllers: [AiController],
  providers: [AiService, DocumentProcessor],
  exports: [AiService],
})
export class AiModule {}
