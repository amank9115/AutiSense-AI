import {
  Controller,
  Post,
  Put,
  Body,
  Get,
  Param,
  Delete,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ScreeningService } from './screening.service';
import { CreateSessionDto, SaveResultDto, SaveAnalysisDto } from './dto';
import { ShareReportDto } from './dto/share-report.dto';
import { ReviewReportDto } from './dto/review-report.dto';
import { Role, ReviewStatus } from '@prisma/client';

interface RequestWithUser {
  user: { sub: string; role: Role };
}

@Controller('api/v1/screening')
export class ScreeningController {
  constructor(private screeningService: ScreeningService) {}

  @UseGuards(JwtAuthGuard)
  @Post('sessions')
  async createSession(
    @Request() req: RequestWithUser,
    @Body() body: CreateSessionDto,
  ) {
    return this.screeningService.createSession({
      userId: req.user.sub,
      childId: body.childId,
      metadata: body.metadata,
    });
  }

  @UseGuards(JwtAuthGuard)
  @Get('sessions')
  async getSessionHistory(
    @Request() req: RequestWithUser,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.screeningService.getUserSessions(
      req.user.sub,
      req.user.role,
      parseInt(page || '1'),
      parseInt(limit || '20'),
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get('sessions/:sessionId')
  async getSession(
    @Param('sessionId') sessionId: string,
    @Request() req: RequestWithUser,
  ) {
    return this.screeningService.getSessionDetails(sessionId, req.user.sub);
  }

  @UseGuards(JwtAuthGuard)
  @Post('sessions/:sessionId/results')
  async saveResult(
    @Param('sessionId') sessionId: string,
    @Request() req: RequestWithUser,
    @Body() body: SaveResultDto,
  ) {
    return this.screeningService.saveScreeningResult(sessionId, req.user.sub, {
      ...body,
      sessionId,
    });
  }

  @UseGuards(JwtAuthGuard)
  @Post('sessions/:sessionId/analysis')
  async saveAnalysis(
    @Param('sessionId') sessionId: string,
    @Request() req: RequestWithUser,
    @Body() body: SaveAnalysisDto,
  ) {
    return this.screeningService.saveAnalysisData(sessionId, req.user.sub, {
      ...body,
      sessionId,
    });
  }

  @UseGuards(JwtAuthGuard)
  @Get('children/:childId/sessions')
  async getChildSessions(
    @Param('childId') childId: string,
    @Request() req: RequestWithUser,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.screeningService.getChildSessions(
      req.user.sub,
      childId,
      parseInt(page || '1'),
      parseInt(limit || '20'),
    );
  }

  @UseGuards(JwtAuthGuard)
  @Delete('sessions/:sessionId')
  async deleteSession(
    @Param('sessionId') sessionId: string,
    @Request() req: RequestWithUser,
  ) {
    return this.screeningService.deleteSession(sessionId, req.user.sub);
  }

  @UseGuards(JwtAuthGuard)
  @Get('statistics')
  async getStatistics(@Request() req: RequestWithUser) {
    return this.screeningService.getUserStatistics(req.user.sub);
  }

  @UseGuards(JwtAuthGuard)
  @Get('doctor/statistics')
  async getDoctorStatistics(@Request() req: RequestWithUser) {
    return this.screeningService.getDoctorStatistics(req.user.sub);
  }

  @UseGuards(JwtAuthGuard)
  @Get('doctor/patients')
  async getDoctorPatients(@Request() req: RequestWithUser) {
    return this.screeningService.getDoctorPatients(req.user.sub);
  }

  @UseGuards(JwtAuthGuard)
  @Post('sessions/:sessionId/share')
  async shareReport(
    @Param('sessionId') sessionId: string,
    @Request() req: RequestWithUser,
    @Body() body: ShareReportDto,
  ) {
    return this.screeningService.shareReport(
      sessionId,
      req.user.sub,
      body.doctorId,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get('reports/received')
  async getReceivedReports(
    @Request() req: RequestWithUser,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
  ) {
    const statusFilter =
      status === ReviewStatus.pending || status === ReviewStatus.reviewed
        ? status
        : undefined;
    return this.screeningService.getDoctorReceivedReports(
      req.user.sub,
      parseInt(page || '1'),
      parseInt(limit || '10'),
      statusFilter,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get('reports/:shareId')
  async getReportShare(
    @Param('shareId') shareId: string,
    @Request() req: RequestWithUser,
  ) {
    return this.screeningService.getReportShareById(shareId, req.user.sub);
  }

  @UseGuards(JwtAuthGuard)
  @Put('reports/:shareId/review')
  async reviewReport(
    @Param('shareId') shareId: string,
    @Request() req: RequestWithUser,
    @Body() body: ReviewReportDto,
  ) {
    return this.screeningService.reviewReport(
      shareId,
      req.user.sub,
      body.notes,
      body.markReviewed ?? false,
      body.reopen ?? false,
    );
  }
}
