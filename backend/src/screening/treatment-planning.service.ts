import { Injectable, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TreatmentPlan, Intervention, ClinicalNote } from '@prisma/client';

interface CreateTreatmentPlanDto {
  childId: string;
  title: string;
  description?: string;
  goals: Array<{
    id: string;
    description: string;
    targetDate?: string;
    metrics?: string[];
  }>;
  startDate: string;
  endDate?: string;
  sessionId?: string;
}

interface AddInterventionDto {
  type: 'therapy' | 'medication' | 'behavioral' | 'educational' | 'other';
  name: string;
  description?: string;
  frequency?: string;
  durationWeeks?: number;
}

interface CreateClinicalNoteDto {
  sessionId?: string;
  childId: string;
  title?: string;
  content: string;
  category?: 'general' | 'observation' | 'assessment' | 'recommendation';
  isPrivate?: boolean;
}

@Injectable()
export class TreatmentPlanningService {
  private readonly logger = new Logger(TreatmentPlanningService.name);

  constructor(private readonly prisma: PrismaService) {}

  // === Treatment Plans ===

  async createPlan(doctorId: string, dto: CreateTreatmentPlanDto): Promise<TreatmentPlan> {
    const plan = await this.prisma.treatmentPlan.create({
      data: {
        childId: dto.childId,
        doctorId,
        title: dto.title,
        description: dto.description,
        goals: dto.goals,
        startDate: new Date(dto.startDate),
        endDate: dto.endDate ? new Date(dto.endDate) : null,
        sessionId: dto.sessionId,
        status: 'active',
      },
      include: {
        child: true,
        doctor: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    this.logger.log(`Treatment plan ${plan.id} created for child ${dto.childId}`);
    return plan;
  }

  async getChildPlans(childId: string): Promise<TreatmentPlan[]> {
    return this.prisma.treatmentPlan.findMany({
      where: { childId },
      orderBy: { createdAt: 'desc' },
      include: {
        doctor: {
          select: { id: true, name: true, email: true },
        },
        interventions: true,
      },
    });
  }

  async getDoctorPlans(doctorId: string): Promise<TreatmentPlan[]> {
    return this.prisma.treatmentPlan.findMany({
      where: { doctorId },
      orderBy: { createdAt: 'desc' },
      include: {
        child: {
          include: {
            parent: {
              select: { id: true, name: true, email: true },
            },
          },
        },
        interventions: true,
      },
    });
  }

  async updatePlan(
    planId: string,
    doctorId: string,
    updates: Partial<CreateTreatmentPlanDto> & { status?: string },
  ): Promise<TreatmentPlan> {
    const plan = await this.prisma.treatmentPlan.findUnique({
      where: { id: planId },
    });

    if (!plan) {
      throw new NotFoundException('Treatment plan not found');
    }

    if (plan.doctorId !== doctorId) {
      throw new ForbiddenException('Only the plan owner can update it');
    }

    return this.prisma.treatmentPlan.update({
      where: { id: planId },
      data: {
        ...updates,
        startDate: updates.startDate ? new Date(updates.startDate) : undefined,
        endDate: updates.endDate ? new Date(updates.endDate) : undefined,
        goals: updates.goals as any,
      },
    });
  }

  // === Interventions ===

  async addIntervention(
    planId: string,
    doctorId: string,
    dto: AddInterventionDto,
  ): Promise<Intervention> {
    // Verify plan ownership
    const plan = await this.prisma.treatmentPlan.findUnique({
      where: { id: planId },
    });

    if (!plan || plan.doctorId !== doctorId) {
      throw new ForbiddenException('Cannot add intervention to this plan');
    }

    return this.prisma.intervention.create({
      data: {
        planId,
        type: dto.type,
        name: dto.name,
        description: dto.description,
        frequency: dto.frequency,
        duration_weeks: dto.durationWeeks,
        status: 'planned',
      },
    });
  }

  async updateIntervention(
    interventionId: string,
    updates: Partial<AddInterventionDto> & { status?: string; effectiveness?: number; notes?: string },
  ): Promise<Intervention> {
    return this.prisma.intervention.update({
      where: { id: interventionId },
      data: updates,
    });
  }

  // === Clinical Notes ===

  async createClinicalNote(
    doctorId: string,
    dto: CreateClinicalNoteDto,
  ): Promise<ClinicalNote> {
    const note = await this.prisma.clinicalNote.create({
      data: {
        sessionId: dto.sessionId,
        childId: dto.childId,
        doctorId,
        title: dto.title,
        content: dto.content,
        category: dto.category || 'general',
        isPrivate: dto.isPrivate ?? false,
      },
      include: {
        doctor: {
          select: { id: true, name: true },
        },
      },
    });

    this.logger.log(`Clinical note ${note.id} created for child ${dto.childId}`);
    return note;
  }

  async getSessionNotes(sessionId: string, userId: string): Promise<ClinicalNote[]> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    return this.prisma.clinicalNote.findMany({
      where: {
        sessionId,
        ...(user?.role !== 'doctor' && { isPrivate: false }),
      },
      orderBy: { createdAt: 'desc' },
      include: {
        doctor: {
          select: { id: true, name: true },
        },
      },
    });
  }

  async getChildNotes(childId: string, userId: string): Promise<ClinicalNote[]> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    return this.prisma.clinicalNote.findMany({
      where: {
        childId,
        ...(user?.role !== 'doctor' && { isPrivate: false }),
      },
      orderBy: { createdAt: 'desc' },
      include: {
        doctor: {
          select: { id: true, name: true },
        },
        session: {
          select: { id: true, completedAt: true },
        },
      },
    });
  }

  async updateNote(
    noteId: string,
    doctorId: string,
    updates: { content?: string; title?: string; category?: string; isPrivate?: boolean },
  ): Promise<ClinicalNote> {
    const note = await this.prisma.clinicalNote.findUnique({
      where: { id: noteId },
    });

    if (!note) {
      throw new NotFoundException('Note not found');
    }

    if (note.doctorId !== doctorId) {
      throw new ForbiddenException('Only the note author can update it');
    }

    return this.prisma.clinicalNote.update({
      where: { id: noteId },
      data: updates,
    });
  }

  // === Progress Tracking ===

  async addProgressNote(
    planId: string,
    doctorId: string,
    note: { content: string; goalId?: string; progress: number },
  ): Promise<TreatmentPlan> {
    const plan = await this.prisma.treatmentPlan.findUnique({
      where: { id: planId },
    });

    if (!plan || plan.doctorId !== doctorId) {
      throw new ForbiddenException('Cannot update this plan');
    }

    const progressNotes = (plan.progressNotes as any[]) || [];
    progressNotes.push({
      ...note,
      timestamp: new Date().toISOString(),
      doctorId,
    });

    return this.prisma.treatmentPlan.update({
      where: { id: planId },
      data: { progressNotes },
    });
  }
}
