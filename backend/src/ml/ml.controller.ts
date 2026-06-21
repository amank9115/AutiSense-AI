import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Res,
  UseGuards,
  Request,
} from '@nestjs/common';
import type { Response } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { MlService } from './ml.service';
import { PrismaService } from '../prisma/prisma.service';
import { CameraScreeningDto, LiveInferenceDto } from './dto';
import { Role } from '@prisma/client';

interface RequestWithUser {
  user: { sub: string; role: Role };
}

@Controller('ml')
export class MlController {
  constructor(
    private readonly mlService: MlService,
    private readonly prisma: PrismaService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Post('camera-screening')
  async cameraScreening(@Body() body: CameraScreeningDto) {
    const sessionKey = `session-${Date.now()}`;
    const frames = body.frames.map((frame, index) => ({
      frame_index: index,
      eye_contact: frame.eyeContact,
      attention_span: frame.attentionSpan,
      emotion_signals: frame.emotionSignals,
      gesture_analysis: frame.gestureAnalysis,
      confidence: frame.confidence,
      image_base64: frame.imageBase64,
    }));

    const result = await this.mlService.predictWindow(
      sessionKey,
      frames,
      body.childInfo,
    );

    return {
      success: result.success,
      sessionId: sessionKey,
      status: 'completed',
      modelVersion: result.model_version,
      riskScore: result.risk_score,
      riskLabel: result.risk_label,
      featureAverages: result.feature_averages,
      recommendations: result.recommendations,
      policy: result.policy,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post('live-inference')
  async liveInference(@Body() body: LiveInferenceDto) {
    const frame = {
      frame_index: body.frame.frameIndex ?? 0,
      eye_contact: body.frame.eyeContact,
      attention_span: body.frame.attentionSpan,
      emotion_signals: body.frame.emotionSignals,
      gesture_analysis: body.frame.gestureAnalysis,
      confidence: body.frame.confidence,
      image_base64: body.frame.imageBase64,
    };

    const result = await this.mlService.predictLive(body.sessionKey, frame, body.childInfo);

    return {
      success: result.success,
      sessionKey: result.session_key,
      modelVersion: result.model_version,
      riskScore: result.risk_score,
      riskLabel: result.risk_label,
      featureAverages: result.feature_averages,
      windowSize: result.window_size,
      recommendations: result.recommendations,
      policy: result.policy,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post('report/:sessionId')
  async generateReport(
    @Param('sessionId') sessionId: string,
    @Request() req: RequestWithUser,
    @Res() res: Response,
  ) {
    // Fetch session + results + child from DB so the PDF is always populated
    const session = await this.prisma.screeningSession.findUnique({
      where: { id: sessionId },
      include: { child: true, results: true },
    });

    const childInfo: Record<string, string> = {};
    if (session?.child?.name) childInfo.childName = session.child.name;

    const results = session?.results as any;
    const behaviors: Record<string, number> = results?.behaviors ?? {};
    const featureAverages: Record<string, number> = {};
    for (const [k, v] of Object.entries(behaviors)) {
      featureAverages[k] = typeof v === 'number' ? v / 100 : 0;
    }

    const reportData = results ? {
      riskScore:       results.riskScore ?? session?.riskScore ?? 0,
      riskLabel:       results.riskLevel ?? session?.riskLevel ?? 'low',
      featureAverages,
      recommendations: (results.recommendations as string[]) ?? [],
      modelVersion:    (results as any).modelVersion ?? undefined,
    } : undefined;

    const pdf = await this.mlService.generateReport(sessionId, childInfo, reportData);

    const childName = session?.child?.name?.replace(/\s+/g, '_') ?? 'report';
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="MannSaathi_${childName}_${sessionId.slice(0, 8)}.pdf"`,
    });
    res.send(Buffer.from(pdf));
  }

  @Get('health')
  async health() {
    return this.mlService.health();
  }
}
