import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  NotFoundException,
  InsufficientPermissionsException,
} from '../common/exceptions';
import { AppointmentStatus } from '@prisma/client';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';

@Injectable()
export class AppointmentsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Doctor schedules an appointment with a patient (child). The parent is
   * derived from the child record so the client cannot spoof it.
   */
  async create(doctorId: string, dto: CreateAppointmentDto) {
    const child = await this.prisma.child.findUnique({
      where: { id: dto.childId },
      select: { id: true, parentId: true },
    });
    if (!child) throw new NotFoundException('Child not found');

    return this.prisma.appointment.create({
      data: {
        doctorId,
        parentId: child.parentId,
        childId: child.id,
        scheduledAt: new Date(dto.scheduledAt),
        durationMins: dto.durationMins ?? 30,
        reason: dto.reason,
        notes: dto.notes,
      },
      include: {
        child: { select: { id: true, name: true, dateOfBirth: true } },
        parent: { select: { id: true, name: true } },
      },
    });
  }

  /**
   * List the doctor's appointments (paginated, optional status filter).
   */
  async findForDoctor(
    doctorId: string,
    status?: AppointmentStatus,
    page = 1,
    limit = 50,
  ) {
    const skip = (page - 1) * limit;
    const where = { doctorId, ...(status && { status }) };

    const [appointments, total] = await Promise.all([
      this.prisma.appointment.findMany({
        where,
        orderBy: { scheduledAt: 'asc' },
        skip,
        take: limit,
        include: {
          child: { select: { id: true, name: true, dateOfBirth: true } },
          parent: { select: { id: true, name: true } },
        },
      }),
      this.prisma.appointment.count({ where }),
    ]);

    return {
      data: appointments,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    };
  }

  async update(id: string, doctorId: string, dto: UpdateAppointmentDto) {
    await this.verifyOwnership(id, doctorId);

    return this.prisma.appointment.update({
      where: { id },
      data: {
        ...(dto.scheduledAt && { scheduledAt: new Date(dto.scheduledAt) }),
        ...(dto.durationMins !== undefined && { durationMins: dto.durationMins }),
        ...(dto.reason !== undefined && { reason: dto.reason }),
        ...(dto.notes !== undefined && { notes: dto.notes }),
        ...(dto.status && { status: dto.status }),
      },
      include: {
        child: { select: { id: true, name: true, dateOfBirth: true } },
        parent: { select: { id: true, name: true } },
      },
    });
  }

  /** Soft-cancel: marks the appointment cancelled rather than deleting it. */
  async cancel(id: string, doctorId: string) {
    await this.verifyOwnership(id, doctorId);
    return this.prisma.appointment.update({
      where: { id },
      data: { status: AppointmentStatus.cancelled },
    });
  }

  private async verifyOwnership(id: string, doctorId: string) {
    const appt = await this.prisma.appointment.findUnique({ where: { id } });
    if (!appt) throw new NotFoundException('Appointment not found');
    if (appt.doctorId !== doctorId) {
      throw new InsufficientPermissionsException(
        'You do not have permission to modify this appointment',
      );
    }
    return appt;
  }
}
