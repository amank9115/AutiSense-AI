import { Injectable } from '@nestjs/common';
import { Child, ScreeningSession, ScreeningResult, User } from '@prisma/client';

@Injectable()
export class FhirMapperService {
  /**
   * Map Child entity to FHIR Patient resource
   */
  toPatient(child: Child & { parent?: User }): any {
    const age = child.dateOfBirth
      ? Math.floor(
          (Date.now() - new Date(child.dateOfBirth).getTime()) /
            (365.25 * 24 * 60 * 60 * 1000),
        )
      : 0;

    return {
      resourceType: 'Patient',
      id: child.id,
      identifier: [
        {
          system: 'https://autisense.ai/fhir/child-id',
          value: child.id,
        },
      ],
      name: [
        {
          use: 'official',
          text: child.name,
        },
      ],
      birthDate: child.dateOfBirth
        ? new Date(child.dateOfBirth).toISOString().split('T')[0]
        : undefined,
      gender: child.gender?.toLowerCase() || 'unknown',
      meta: {
        lastUpdated: child.updatedAt.toISOString(),
        versionId: '1',
      },
      extension: [
        {
          url: 'https://autisense.ai/fhir/extension/age',
          valueInteger: age,
        },
      ],
    };
  }

  /**
   * Map ScreeningResult to FHIR Observation resource
   */
  toObservation(
    session: ScreeningSession & {
      results?: ScreeningResult | null;
      child?: Child;
    },
  ): any {
    const riskLevelCode =
      session.results?.riskLevel?.replace('_', '-') || 'unknown';

    return {
      resourceType: 'Observation',
      id: `observation-${session.id}`,
      status: 'final',
      category: [
        {
          coding: [
            {
              system:
                'http://terminology.hl7.org/CodeSystem/observation-category',
              code: 'survey',
              display: 'Survey',
            },
            {
              system:
                'http://terminology.hl7.org/CodeSystem/observation-category',
              code: 'behavior',
              display: 'Behavior',
            },
          ],
        },
      ],
      code: {
        coding: [
          {
            system: 'https://autisense.ai/fhir/observation-type',
            code: 'asd-screening',
            display: 'Autism Spectrum Disorder Screening',
          },
        ],
        text: 'ASD Risk Assessment',
      },
      subject: {
        reference: `Patient/${session.childId}`,
        display: session.child?.name,
      },
      effectiveDateTime:
        session.completedAt?.toISOString() || session.createdAt.toISOString(),
      issued: session.createdAt.toISOString(),
      valueQuantity: {
        value: session.results?.riskScore || session.riskScore || 0,
        unit: '%',
        system: 'https://autisense.ai/fhir/risk-score',
        code: 'percentage',
      },
      interpretation: [
        {
          coding: [
            {
              system: 'https://autisense.ai/fhir/risk-level',
              code: riskLevelCode,
              display: this.getRiskLevelDisplay(
                session.results?.riskLevel || 'low',
              ),
            },
          ],
        },
      ],
      meta: {
        lastUpdated: session.updatedAt.toISOString(),
        versionId: '1',
      },
    };
  }

  /**
   * Map ScreeningSession to FHIR DiagnosticReport resource
   */
  toDiagnosticReport(
    session: ScreeningSession & {
      results?: ScreeningResult | null;
      child?: Child;
    },
  ): any {
    return {
      resourceType: 'DiagnosticReport',
      id: `report-${session.id}`,
      status: session.status === 'completed' ? 'final' : 'partial',
      category: [
        {
          coding: [
            {
              system: 'http://terminology.hl7.org/CodeSystem/v2-0074',
              code: 'BH',
              display: 'Behavioral Health',
            },
          ],
        },
      ],
      code: {
        coding: [
          {
            system: 'https://autisense.ai/fhir/report-type',
            code: 'asd-screening-report',
            display: 'ASD Screening Report',
          },
        ],
        text: 'Autism Spectrum Disorder Screening Report',
      },
      subject: {
        reference: `Patient/${session.childId}`,
        display: session.child?.name,
      },
      effectiveDateTime:
        session.completedAt?.toISOString() || session.createdAt.toISOString(),
      issued: session.createdAt.toISOString(),
      conclusion:
        session.results?.summary || session.summary || 'Screening completed',
      conclusionCode: [
        {
          coding: [
            {
              system: 'https://autisense.ai/fhir/risk-level',
              code: session.results?.riskLevel?.replace('_', '-') || 'low',
              display: this.getRiskLevelDisplay(
                session.results?.riskLevel || 'low',
              ),
            },
          ],
        },
      ],
      result: [
        {
          reference: `Observation/observation-${session.id}`,
          display: 'ASD Risk Assessment',
        },
      ],
      meta: {
        lastUpdated: session.updatedAt.toISOString(),
        versionId: '1',
      },
    };
  }

  private getRiskLevelDisplay(riskLevel: string): string {
    const displayMap: Record<string, string> = {
      low: 'Low Risk',
      medium: 'Medium Risk',
      high: 'High Risk',
      very_high: 'Very High Risk',
    };
    return displayMap[riskLevel] || 'Unknown Risk';
  }
}
