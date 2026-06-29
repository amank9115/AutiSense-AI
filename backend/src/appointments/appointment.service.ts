import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Appointment, AppointmentStatus } from '@prisma/client';

interface CreateAppointmentDto {
  doctorId: string;
  childId: string;
  scheduledAt: string;
  durationMins?: number;
  reason?: string;
}

interface UpdateAppointmentDto {
  scheduledAt?: string;
  durationMins?: number;
  reason?: string;
  status?: AppointmentStatus;
  notes?: string;
}

interface AvailabilitySlot {
  start: Date;
  end: Date;
  available: boolean;
}

@Injectable()
export class AppointmentService {
  private readonly logger = new Logger(AppointmentService.name);

  constructor(private readonly prisma: PrismaService) {}

  async createAppointment(
    parentId: string,
    dto: CreateAppointmentDto,
  ): Promise<Appointment> {
    // Verify doctor exists
    const doctor = await this.prisma.user.findUnique({
      where: { id: dto.doctorId, role: 'doctor' },
    });

    if (!doctor) {
      throw new NotFoundException('Doctor not found');
    }

    // Verify child belongs to parent
    const child = await this.prisma.child.findFirst({
      where: { id: dto.childId, parentId },
    });

    if (!child) {
      throw new NotFoundException('Child not found');
    }

    // Check for conflicts
    const scheduledTime = new Date(dto.scheduledAt);
    const duration = dto.durationMins || 30;

    const conflict = await this.prisma.appointment.findFirst({
      where: {
        doctorId: dto.doctorId,
        scheduledAt: scheduledTime,
        status: { notIn: ['cancelled'] },
      },
    });

    if (conflict) {
      throw new ConflictException(
        'Doctor already has an appointment at this time',
      );
    }

    const appointment = await this.prisma.appointment.create({
      data: {
        doctorId: dto.doctorId,
        parentId,
        childId: dto.childId,
        scheduledAt: scheduledTime,
        durationMins: duration,
        reason: dto.reason,
        status: 'scheduled',
      },
      include: {
        doctor: {
          select: { id: true, name: true, email: true },
        },
        child: {
          select: { id: true, name: true },
        },
        parent: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    this.logger.log(
      `Appointment ${appointment.id} created for ${scheduledTime.toISOString()}`,
    );
    return appointment;
  }

  async getParentAppointments(
    parentId: string,
    options: { status?: AppointmentStatus; upcoming?: boolean } = {},
  ): Promise<Appointment[]> {
    const where: any = { parentId };

    if (options.status) {
      where.status = options.status;
    }

    if (options.upcoming) {
      where.scheduledAt = { gte: new Date() };
      where.status = 'scheduled';
    }

    return this.prisma.appointment.findMany({
      where,
      orderBy: { scheduledAt: 'asc' },
      include: {
        doctor: {
          select: { id: true, name: true, email: true, specialization: true },
        },
        child: {
          select: { id: true, name: true, dateOfBirth: true },
        },
      },
    });
  }

  async getDoctorAppointments(
    doctorId: string,
    options: { status?: AppointmentStatus; upcoming?: boolean } = {},
  ): Promise<Appointment[]> {
    const where: any = { doctorId };

    if (options.status) {
      where.status = options.status;
    }

    if (options.upcoming) {
      where.scheduledAt = { gte: new Date() };
      where.status = 'scheduled';
    }

    return this.prisma.appointment.findMany({
      where,
      orderBy: { scheduledAt: 'asc' },
      include: {
        parent: {
          select: { id: true, name: true, email: true, phone: true },
        },
        child: {
          select: { id: true, name: true, dateOfBirth: true },
        },
      },
    });
  }

  async getAppointment(
    appointmentId: string,
    userId: string,
  ): Promise<Appointment> {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        doctor: {
          select: { id: true, name: true, email: true },
        },
        parent: {
          select: { id: true, name: true, email: true, phone: true },
        },
        child: {
          select: {
            id: true,
            name: true,
            dateOfBirth: true,
            medicalNotes: true,
          },
        },
      },
    });

    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }

    // Verify access
    if (appointment.doctorId !== userId && appointment.parentId !== userId) {
      throw new ForbiddenException('Access denied to this appointment');
    }

    return appointment;
  }

  async updateAppointment(
    appointmentId: string,
    userId: string,
    dto: UpdateAppointmentDto,
  ): Promise<Appointment> {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id: appointmentId },
    });

    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }

    // Only parent or doctor can update
    if (appointment.doctorId !== userId && appointment.parentId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    // Only doctor can mark as completed
    if (dto.status === 'completed' && appointment.doctorId !== userId) {
      throw new ForbiddenException(
        'Only the doctor can mark appointments as completed',
      );
    }

    const updateData: any = {};
    if (dto.scheduledAt) updateData.scheduledAt = new Date(dto.scheduledAt);
    if (dto.durationMins) updateData.durationMins = dto.durationMins;
    if (dto.reason) updateData.reason = dto.reason;
    if (dto.status) updateData.status = dto.status;
    if (dto.notes) updateData.notes = dto.notes;

    const updated = await this.prisma.appointment.update({
      where: { id: appointmentId },
      data: updateData,
      include: {
        doctor: { select: { id: true, name: true, email: true } },
        parent: { select: { id: true, name: true, email: true } },
        child: { select: { id: true, name: true } },
      },
    });

    this.logger.log(
      `Appointment ${appointmentId} updated: ${JSON.stringify(dto)}`,
    );
    return updated;
  }

  async cancelAppointment(
    appointmentId: string,
    userId: string,
  ): Promise<Appointment> {
    return this.updateAppointment(appointmentId, userId, {
      status: 'cancelled',
    });
  }

  async getDoctorAvailability(
    doctorId: string,
    date: string,
  ): Promise<AvailabilitySlot[]> {
    // Get existing appointments for the date
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const appointments = await this.prisma.appointment.findMany({
      where: {
        doctorId,
        scheduledAt: {
          gte: startOfDay,
          lte: endOfDay,
        },
        status: { not: 'cancelled' },
      },
    });

    // Generate available slots (9 AM to 5 PM, 30-min slots)
    const slots: AvailabilitySlot[] = [];
    const current = new Date(startOfDay);
    current.setHours(9, 0, 0, 0);

    while (current.getHours() < 17) {
      const slotStart = new Date(current);
      const slotEnd = new Date(current.getTime() + 30 * 60 * 1000);

      const isBooked = appointments.some((apt) => {
        const aptStart = new Date(apt.scheduledAt);
        const aptEnd = new Date(
          aptStart.getTime() + apt.durationMins * 60 * 1000,
        );
        return slotStart < aptEnd && slotEnd > aptStart;
      });

      slots.push({
        start: slotStart,
        end: slotEnd,
        available: !isBooked,
      });

      current.setTime(current.getTime() + 30 * 60 * 1000);
    }

    return slots;
  }
}
