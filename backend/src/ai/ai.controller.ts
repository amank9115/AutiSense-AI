import { Controller, Post, Body, Param, UseGuards } from '@nestjs/common';
import { AiService } from './ai.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { IngestDto } from './dto/ingest.dto';
import { ChatDto } from './dto/chat.dto';

@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('ingest')
  @UseGuards(JwtAuthGuard)
  ingestDocument(@Body() ingestDto: IngestDto) {
    return this.aiService.queueDocumentForIngestion(
      ingestDto.documentId,
      ingestDto.fileUrl,
      ingestDto.mimetype,
    );
  }

  @Post('chat/global-search')
  @UseGuards(JwtAuthGuard)
  async globalSearch(@Body() chatDto: ChatDto) {
    const message = await this.aiService.globalSearch(chatDto.message);
    return { message };
  }

  @Post('chat/:sessionId')
  @UseGuards(JwtAuthGuard)
  async chat(@Param('sessionId') sessionId: string, @Body() chatDto: ChatDto) {
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
