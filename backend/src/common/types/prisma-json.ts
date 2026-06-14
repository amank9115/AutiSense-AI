import { JsonValue } from '@prisma/client/runtime/library';

/**
 * Type-safe Prisma Json field types for the ScreeningSession model
 */

export interface ScreeningSessionMetadata {
  metrics?: JsonValue[];
  cameraSettings?: {
    resolution?: string;
    fps?: number;
    codec?: string;
  };
  qualityMetrics?: {
    clarity?: number;
    brightness?: number;
    contrast?: number;
  };
}

export interface ScreeningResultBehaviors {
  behaviors?: Array<{
    behavior: string;
    confidence: number;
    duration: number;
    timestamp: number;
  }>;
  summary?: Record<string, unknown>;
}

export type RiskLevel = 'low' | 'medium' | 'high' | 'very_high';
