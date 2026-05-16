import {
  Controller,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
  Get,
} from '@nestjs/common';
import { AiService } from './ai.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { IngestDto } from './dto/ingest.dto';
import { ChatDto } from './dto/chat.dto';

interface RequestWithUser {
  user: { userId: string; email: string; role: string };
}

@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('ingest')
  async ingestDocument(
    @Body() ingestDto: IngestDto,
  ) {
    return this.aiService.queueDocumentForIngestion(
      ingestDto.documentId,
      ingestDto.fileUrl,
      ingestDto.mimetype,
    );
  }

  @Post('chat/:sessionId')
  @UseGuards(JwtAuthGuard)
  async chat(
    @Param('sessionId') sessionId: string,
    @Body() chatDto: ChatDto,
    @Request() req: RequestWithUser,
  ) {
    const stream = await this.aiService.streamChat(sessionId, chatDto.message);
    let fullResponse = '';

    const chunks: string[] = [];
    for await (const chunk of stream) {
      fullResponse += chunk;
      chunks.push(chunk);
    }

    await this.aiService.saveAssistantMessage(sessionId, fullResponse);

    return { message: fullResponse };
  }
}
