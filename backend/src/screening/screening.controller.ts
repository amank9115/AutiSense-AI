import {
  Controller,
  Post,
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
import { Role } from '@prisma/client';

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
    return this.screeningService.saveScreeningResult(
      sessionId,
      req.user.sub,
      { ...body, sessionId },
    );
  }

  @UseGuards(JwtAuthGuard)
  @Post('sessions/:sessionId/analysis')
  async saveAnalysis(
    @Param('sessionId') sessionId: string,
    @Request() req: RequestWithUser,
    @Body() body: SaveAnalysisDto,
  ) {
    return this.screeningService.saveAnalysisData(sessionId, req.user.sub, { ...body, sessionId });
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
}
