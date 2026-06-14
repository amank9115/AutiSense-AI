import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { DocumentProcessor } from './document.processor';
import {
  ScreeningSessionMetadata,
  ScreeningResultBehaviors,
  RiskLevel,
} from '../common/types/prisma-json';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private llm: BaseChatModel;

  constructor(
    private prisma: PrismaService,
    private documentProcessor: DocumentProcessor,
  ) {
    this.llm = new ChatGoogleGenerativeAI({
      model: process.env.GEMINI_MODEL || 'gemini-2.0-flash',
      apiKey: process.env.GEMINI_API_KEY,
      maxRetries: 2,
    });
  }

  queueDocumentForIngestion(
    documentId: string,
    fileUrl: string,
    mimetype: string,
  ) {
    this.logger.log(
      `Document ingestion started asynchronously for ${documentId} (Native async processing)`,
    );
    // Run asynchronously without awaiting so the endpoint responds immediately
    this.documentProcessor
      .processDocument({ documentId, fileUrl, mimetype })
      .catch((err) => {
        this.logger.error(
          `Async processing failed for document ${documentId}`,
          err,
        );
      });
    return { status: 'processing' as const, documentId };
  }

  async streamChat(sessionId: string, message: string) {
    // 1. Retrieve chat history
    const session = await this.prisma.chatSession.findUnique({
      where: { id: sessionId },
      include: { messages: true },
    });

    if (!session) {
      throw new Error('Session not found');
    }

    // Save user message
    await this.prisma.chatMessage.create({
      data: {
        sessionId,
        role: 'user',
        content: message,
      },
    });

    // 2. Build context from chat history only (RAG disabled pending document models)
    const context =
      'No external documents available. Answer based on your general knowledge about autism support.';

    // 3. Setup prompt
    const prompt = ChatPromptTemplate.fromMessages([
      [
        'system',
        'You are a helpful assistant for parents of children with autism. Use the following context to answer the user: {context}',
      ],
      ...session.messages.map(
        (m: { role: string; content: string }) =>
          [m.role === 'user' ? 'user' : 'assistant', m.content] as [
            'user' | 'assistant',
            string,
          ],
      ),
      ['user', '{input}'] as ['user', string],
    ]);

    const chain = prompt.pipe(this.llm).pipe(new StringOutputParser());

    // 4. Return the stream
    const stream = await chain.stream({
      context: context || 'No relevant context found.',
      input: message,
    });

    return stream; // This is an async generator
  }

  async saveAssistantMessage(sessionId: string, content: string) {
    await this.prisma.chatMessage.create({
      data: {
        sessionId,
        role: 'assistant',
        content,
      },
    });
  }

  async saveScreeningResult(data: {
    userId: string;
    childId: string;
    riskScore: number;
    riskLabel: string;
    summary: Record<string, unknown>;
    recommendations: string[];
    metrics: Record<string, unknown>[];
  }) {
    const session = await this.prisma.screeningSession.create({
      data: {
        userId: data.userId,
        childId: data.childId,
        riskScore: data.riskScore,
        riskLevel: data.riskLabel as RiskLevel,
        summary: JSON.stringify(data.summary),
        metadata: { metrics: data.metrics } as ScreeningSessionMetadata,
      },
    });

    await this.prisma.screeningResult.create({
      data: {
        sessionId: session.id,
        riskScore: data.riskScore,
        riskLevel: data.riskLabel as RiskLevel,
        behaviors: data.metrics as ScreeningResultBehaviors,
        summary: JSON.stringify(data.summary),
        recommendations: data.recommendations,
      },
    });

    return { success: true, sessionId: session.id, ...data };
  }

  async getScreeningHistory(userId: string) {
    return this.prisma.screeningSession.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
  }

  async getScreeningSession(sessionId: string) {
    return this.prisma.screeningSession.findUnique({
      where: { id: sessionId },
    });
  }
}
