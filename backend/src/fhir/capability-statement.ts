// FHIR R4 Capability Statement
export const CAPABILITY_STATEMENT = {
  resourceType: 'CapabilityStatement',
  id: 'autisense-fhir-server',
  url: 'https://autisense.ai/fhir/CapabilityStatement/autisense-fhir-server',
  name: 'AutiSenseAI FHIR Server',
  title: 'AutiSense AI FHIR Server',
  status: 'active',
  experimental: true,
  date: new Date().toISOString().split('T')[0],
  publisher: 'AutiSense AI',
  kind: 'instance',
  fhirVersion: '4.0.1',
  format: ['json'],
  rest: [
    {
      mode: 'server',
      security: {
        cors: true,
        service: [
          {
            coding: [
              {
                system: 'http://terminology.hl7.org/CodeSystem/restful-security-service',
                code: 'SMART-on-FHIR',
                display: 'SMART on FHIR',
              },
            ],
            text: 'SMART on FHIR Authorization',
          },
        ],
        description: 'OAuth2 authorization required for FHIR API access',
      },
      resource: [
        {
          type: 'Patient',
          profile: 'http://hl7.org/fhir/StructureDefinition/Patient',
          interaction: [
            { code: 'read' },
            { code: 'search-type' },
          ],
          searchParam: [
            {
              name: 'identifier',
              type: 'token',
              documentation: 'Patient identifier',
            },
            {
              name: 'name',
              type: 'string',
              documentation: 'Patient name',
            },
          ],
        },
        {
          type: 'Observation',
          profile: 'http://hl7.org/fhir/StructureDefinition/Observation',
          interaction: [
            { code: 'read' },
            { code: 'search-type' },
            { code: 'create' },
          ],
          searchParam: [
            {
              name: 'patient',
              type: 'reference',
              documentation: 'Subject of the observation',
            },
            {
              name: 'category',
              type: 'token',
              documentation: 'Classification of observation',
            },
          ],
        },
        {
          type: 'DiagnosticReport',
          profile: 'http://hl7.org/fhir/StructureDefinition/DiagnosticReport',
          interaction: [
            { code: 'read' },
            { code: 'search-type' },
          ],
          searchParam: [
            {
              name: 'patient',
              type: 'reference',
              documentation: 'Subject of the report',
            },
            {
              name: 'status',
              type: 'token',
              documentation: 'Report status',
            },
          ],
        },
      ],
    },
  ],
};
