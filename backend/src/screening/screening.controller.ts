import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  UseGuards,
  Request,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PrismaService } from '../prisma/prisma.service';
import { AiService } from '../ai/ai.service';

interface RequestWithUser {
  user: { userId: string };
}

@Controller('screening')
export class ScreeningController {
  constructor(
    private prisma: PrismaService,
    private aiService: AiService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Post('save')
  async saveScreeningResult(
    @Request() req: RequestWithUser,
    @Body()
    body: {
      source: string;
      modelVersion: string;
      riskScore: number;
      riskLabel: string;
      summary: any;
      recommendations: string[];
      metrics: any[];
    },
  ) {
    const result = await this.aiService.saveScreeningResult({
      userId: req.user.userId,
      source: body.source,
      modelVersion: body.modelVersion,
      riskScore: body.riskScore,
      riskLabel: body.riskLabel,
      summary: body.summary,
      recommendations: body.recommendations,
      metrics: body.metrics,
    });
    return { success: true, sessionId: result.sessionId };
  }

  @UseGuards(JwtAuthGuard)
  @Get('history')
  async getHistory(@Request() req: RequestWithUser) {
    return this.prisma.screeningSession.findMany({
      where: { userId: req.user.userId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async getSession(@Param('id') id: string, @Request() req: RequestWithUser) {
    const session = await this.prisma.screeningSession.findUnique({
      where: { id },
    });
    if (!session || session.userId !== req.user.userId) {
      throw new HttpException('Session not found', HttpStatus.NOT_FOUND);
    }
    return session;
  }
}
