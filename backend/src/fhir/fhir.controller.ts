import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  UseGuards,
  Body,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ApiKeyGuard } from '../api-keys/api-key.guard';
import { ScopeGuard } from '../api-keys/scopes/scope.guard';
import { RequireScopes } from '../api-keys/scopes/require-scope.decorator';
import { ApiScope } from '../api-keys/scopes/scopes.enum';
import { PrismaService } from '../prisma/prisma.service';
import { FhirMapperService } from './fhir-mapper.service';
import { CAPABILITY_STATEMENT } from './capability-statement';

@Controller('api/v1/fhir')
@UseGuards(ApiKeyGuard, ScopeGuard)
export class FhirController {
  constructor(
    private prisma: PrismaService,
    private mapper: FhirMapperService,
  ) {}

  @Get('metadata')
  getCapabilityStatement() {
    return CAPABILITY_STATEMENT;
  }

  @Get('Patient')
  @RequireScopes(ApiScope.FHIR_READ)
  async listPatients(
    @Query('identifier') identifier?: string,
    @Query('name') name?: string,
    @Query('_count') count?: string,
  ) {
    const take = count ? parseInt(count, 10) : 20;
    const where: any = {};
    if (identifier) where.id = identifier;
    if (name) where.name = { contains: name, mode: 'insensitive' };

    const children = await this.prisma.child.findMany({
      where,
      take,
      include: { parent: { select: { id: true, name: true } } },
    });

    return {
      resourceType: 'Bundle',
      type: 'searchset',
      total: children.length,
      entry: children.map((child) => ({
        resource: this.mapper.toPatient(child as any),
      })),
    };
  }

  @Get('Patient/:id')
  @RequireScopes(ApiScope.FHIR_READ)
  async getPatient(@Param('id') id: string) {
    const child = await this.prisma.child.findUnique({
      where: { id },
      include: { parent: { select: { id: true, name: true } } },
    });

    if (!child) {
      throw new HttpException({ resourceType: 'OperationOutcome', issue: [{ severity: 'error', code: 'not-found', diagnostics: 'Patient not found' }] }, HttpStatus.NOT_FOUND);
    }

    return this.mapper.toPatient(child as any);
  }

  @Get('Observation')
  @RequireScopes(ApiScope.FHIR_READ)
  async listObservations(
    @Query('patient') patient?: string,
    @Query('category') category?: string,
    @Query('_count') count?: string,
  ) {
    const take = count ? parseInt(count, 10) : 20;
    const where: any = {};
    if (patient) where.childId = patient;

    const sessions = await this.prisma.screeningSession.findMany({
      where,
      take,
      include: { results: true, child: { select: { id: true, name: true } } },
    });

    return {
      resourceType: 'Bundle',
      type: 'searchset',
      total: sessions.length,
      entry: sessions.map((session) => ({
        resource: this.mapper.toObservation(session as any),
      })),
    };
  }

  @Get('Observation/:id')
  @RequireScopes(ApiScope.FHIR_READ)
  async getObservation(@Param('id') id: string) {
    const sessionId = id.replace('observation-', '');
    const session = await this.prisma.screeningSession.findUnique({
      where: { id: sessionId },
      include: { results: true, child: { select: { id: true, name: true } } },
    });

    if (!session) {
      throw new HttpException({ resourceType: 'OperationOutcome', issue: [{ severity: 'error', code: 'not-found', diagnostics: 'Observation not found' }] }, HttpStatus.NOT_FOUND);
    }

    return this.mapper.toObservation(session as any);
  }

  @Get('DiagnosticReport')
  @RequireScopes(ApiScope.FHIR_READ)
  async listReports(
    @Query('patient') patient?: string,
    @Query('status') status?: string,
    @Query('_count') count?: string,
  ) {
    const take = count ? parseInt(count, 10) : 20;
    const where: any = {};
    if (patient) where.childId = patient;
    if (status) where.status = status === 'final' ? 'completed' : status;

    const sessions = await this.prisma.screeningSession.findMany({
      where,
      take,
      include: { results: true, child: { select: { id: true, name: true } } },
    });

    return {
      resourceType: 'Bundle',
      type: 'searchset',
      total: sessions.length,
      entry: sessions.map((session) => ({
        resource: this.mapper.toDiagnosticReport(session as any),
      })),
    };
  }

  @Get('DiagnosticReport/:id')
  @RequireScopes(ApiScope.FHIR_READ)
  async getReport(@Param('id') id: string) {
    const sessionId = id.replace('report-', '');
    const session = await this.prisma.screeningSession.findUnique({
      where: { id: sessionId },
      include: { results: true, child: { select: { id: true, name: true } } },
    });

    if (!session) {
      throw new HttpException({ resourceType: 'OperationOutcome', issue: [{ severity: 'error', code: 'not-found', diagnostics: 'DiagnosticReport not found' }] }, HttpStatus.NOT_FOUND);
    }

    return this.mapper.toDiagnosticReport(session as any);
  }

  @Post('Observation')
  @RequireScopes(ApiScope.FHIR_WRITE)
  async createObservation(@Body() resource: any) {
    // Accept external FHIR observations (e.g., from partner systems)
    // This is a stub - actual implementation would validate and store the observation
    return {
      resourceType: 'Observation',
      id: `observation-${Date.now()}`,
      status: resource.status || 'registered',
      meta: {
        lastUpdated: new Date().toISOString(),
        versionId: '1',
      },
    };
  }
}
