// API Scope definitions for fine-grained access control
export enum ApiScope {
  // Read scopes
  SCREENING_READ = 'screening:read',
  CHILD_READ = 'child:read',
  REPORT_READ = 'report:read',
  ANALYTICS_READ = 'analytics:read',

  // Write scopes
  SCREENING_WRITE = 'screening:write',
  CHILD_WRITE = 'child:write',

  // Healthcare scopes (requires certification)
  FHIR_READ = 'fhir:read',
  FHIR_WRITE = 'fhir:write',

  // Research scopes
  RESEARCH_EXPORT = 'research:export',
  RESEARCH_BATCH = 'research:batch',
}

export const SCOPE_DESCRIPTIONS: Record<ApiScope, string> = {
  [ApiScope.SCREENING_READ]: 'View screening sessions and results',
  [ApiScope.CHILD_READ]: 'View child profiles',
  [ApiScope.REPORT_READ]: 'Download screening reports',
  [ApiScope.ANALYTICS_READ]: 'Access analytics dashboards',
  [ApiScope.SCREENING_WRITE]: 'Create screening sessions',
  [ApiScope.CHILD_WRITE]: 'Manage child profiles',
  [ApiScope.FHIR_READ]: 'FHIR-compliant data access',
  [ApiScope.FHIR_WRITE]: 'FHIR-compliant data submission',
  [ApiScope.RESEARCH_EXPORT]: 'Anonymized data export',
  [ApiScope.RESEARCH_BATCH]: 'Batch processing access',
};

export const HEALTHCARE_SCOPES: ApiScope[] = [
  ApiScope.FHIR_READ,
  ApiScope.FHIR_WRITE,
];

export const RESEARCH_SCOPES: ApiScope[] = [
  ApiScope.RESEARCH_EXPORT,
  ApiScope.RESEARCH_BATCH,
];
