import { Injectable, Logger } from '@nestjs/common';

export interface MlHealthResponse {
  ok: boolean;
  model_ready: boolean;
  model_version: string;
}

interface MlPredictResponse {
  success: boolean;
  model_version: string;
  risk_score: number;
  risk_label: string;
  feature_averages: Record<string, number>;
  recommendations: string[];
  policy: string;
  window_size?: number;
  session_key?: string;
  aq_scores?: Record<string, number>;
}

@Injectable()
export class MlService {
  private readonly logger = new Logger(MlService.name);
  private readonly baseUrl: string;
  private readonly enabled: boolean;
  private readonly timeout: number;

  constructor() {
    this.enabled = process.env.PY_ML_ENABLED === 'true';
    this.baseUrl = process.env.PY_ML_BASE_URL || 'http://127.0.0.1:8001';
    this.timeout = parseInt(process.env.PY_ML_TIMEOUT_MS || '2500', 10);
  }

  private async request<T>(path: string, options?: RequestInit): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(`${this.baseUrl}${path}`, {
        ...options,
        signal: controller.signal,
        headers: { 'Content-Type': 'application/json', ...options?.headers },
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`ML service error (${response.status}): ${text}`);
      }

      return (await response.json()) as T;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  async health(): Promise<MlHealthResponse> {
    return this.request<MlHealthResponse>('/health');
  }

  async predictLive(
    sessionKey: string,
    frame: Record<string, unknown>,
    childInfo?: Record<string, string>,
  ): Promise<MlPredictResponse> {
    if (!this.enabled) {
      throw new Error('Python ML service is disabled');
    }

    return this.request<MlPredictResponse>('/predict/live', {
      method: 'POST',
      body: JSON.stringify({ session_key: sessionKey, frame, child_info: childInfo }),
    });
  }

  async predictWindow(
    sessionKey: string,
    frames: Record<string, unknown>[],
    childInfo?: Record<string, string>,
  ): Promise<MlPredictResponse> {
    if (!this.enabled) {
      throw new Error('Python ML service is disabled');
    }

    return this.request<MlPredictResponse>('/predict/window', {
      method: 'POST',
      body: JSON.stringify({ session_key: sessionKey, frames, ...childInfo }),
    });
  }

  async generateReport(sessionKey: string, childInfo?: Record<string, string>): Promise<ArrayBuffer> {
    if (!this.enabled) {
      throw new Error('Python ML service is disabled');
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(`${this.baseUrl}/report/generate`, {
        method: 'POST',
        body: JSON.stringify({ session_key: sessionKey, ...childInfo }),
        signal: controller.signal,
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Report generation failed (${response.status}): ${text}`);
      }

      return await response.arrayBuffer();
    } finally {
      clearTimeout(timeoutId);
    }
  }

  async getSessionData(sessionKey: string): Promise<Record<string, unknown>> {
    if (!this.enabled) {
      throw new Error('Python ML service is disabled');
    }

    return this.request<Record<string, unknown>>(`/report/session/${sessionKey}`);
  }
}
