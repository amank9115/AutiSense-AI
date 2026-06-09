import { Controller, Post, Body, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { MlService } from './ml.service';
import { CameraScreeningDto, LiveInferenceDto } from './dto';

@Controller('ml')
export class MlController {
  constructor(private readonly mlService: MlService) {}

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

    const result = await this.mlService.predictLive(body.sessionKey, frame);

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

  @Get('health')
  async health() {
    return this.mlService.health();
  }
}
