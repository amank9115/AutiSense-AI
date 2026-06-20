import { Module } from '@nestjs/common';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { AiService, CHAT_MODEL } from './ai.service';
import { AiController } from './ai.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { DocumentProcessor } from './document.processor';

@Module({
  imports: [PrismaModule],
  controllers: [AiController],
  providers: [
    AiService,
    DocumentProcessor,
    {
      // Provide the LangChain chat model behind a token so tests can supply a fake.
      provide: CHAT_MODEL,
      useFactory: () =>
        new ChatGoogleGenerativeAI({
          model: process.env.GEMINI_MODEL || 'gemini-2.0-flash',
          apiKey: process.env.GEMINI_API_KEY,
          maxRetries: 2,
        }),
    },
  ],
  exports: [AiService],
})
export class AiModule {}
