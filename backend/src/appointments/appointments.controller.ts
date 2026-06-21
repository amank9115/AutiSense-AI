import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AppointmentsService } from './appointments.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
import { AppointmentStatus, Role } from '@prisma/client';

interface RequestWithUser {
  user: { sub: string; role: Role };
}

@Controller('api/v1/appointments')
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  async create(
    @Request() req: RequestWithUser,
    @Body() body: CreateAppointmentDto,
  ) {
    return this.appointmentsService.create(req.user.sub, body);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  async list(
    @Request() req: RequestWithUser,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const statusFilter = (
      Object.values(AppointmentStatus) as string[]
    ).includes(status ?? '')
      ? (status as AppointmentStatus)
      : undefined;
    return this.appointmentsService.findForDoctor(
      req.user.sub,
      statusFilter,
      parseInt(page || '1'),
      parseInt(limit || '50'),
    );
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Request() req: RequestWithUser,
    @Body() body: UpdateAppointmentDto,
  ) {
    return this.appointmentsService.update(id, req.user.sub, body);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async cancel(@Param('id') id: string, @Request() req: RequestWithUser) {
    return this.appointmentsService.cancel(id, req.user.sub);
  }
}
