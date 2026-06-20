import { Injectable, Logger } from '@nestjs/common';
import { AppConfigService } from '../config/config.service';
import {
  CircuitBreakerService,
  CircuitState,
} from '../common/circuit-breaker/circuit-breaker.service';
import {
  MLServiceUnavailableException,
  MLAnalysisFailedException,
} from '../common/exceptions';

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

const ML_CIRCUIT_NAME = 'ml-service';

@Injectable()
export class MlService {
  private readonly logger = new Logger(MlService.name);
  private readonly baseUrl: string;
  private readonly enabled: boolean;
  private readonly timeout: number;
  private readonly maxRetries = 3;
  private readonly retryDelay = 1000; // ms

  constructor(
    private config: AppConfigService,
    private circuitBreaker: CircuitBreakerService,
  ) {
    this.enabled = this.config.mlService.enabled;
    this.baseUrl = this.config.mlService.baseUrl;
    this.timeout = this.config.mlService.timeoutMs;

    // Initialize circuit breaker config
    this.circuitBreaker.getCircuit(ML_CIRCUIT_NAME, {
      failureThreshold: 5,
      successThreshold: 2,
      timeout: 60000, // 1 minute
    });
  }

  /**
   * Maps camelCase childInfo from the API layer to the snake_case keys the
   * Python ML service expects. Unknown keys are dropped.
   */
  private mapChildInfo(
    childInfo?: Record<string, string>,
  ): Record<string, string> {
    if (!childInfo) {
      return {};
    }
    const keyMap: Record<string, string> = {
      childName: 'child_name',
      parentName: 'parent_name',
      parentEmail: 'parent_email',
      parentPhone: 'parent_phone',
      dateOfBirth: 'date_of_birth',
      gender: 'gender',
      age: 'age',
      city: 'city',
      state: 'state',
    };
    const mapped: Record<string, string> = {};
    for (const [key, value] of Object.entries(childInfo)) {
      if (value === undefined || value === null) continue;
      mapped[keyMap[key] ?? key] = value;
    }
    return mapped;
  }

  private async sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private async request<T>(
    path: string,
    options?: RequestInit,
    retryCount = 0,
  ): Promise<T> {
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
        throw new MLServiceUnavailableException(
          `ML service error (${response.status}): ${text}`,
        );
      }

      // Record success for circuit breaker
      this.circuitBreaker.recordSuccess(ML_CIRCUIT_NAME);

      return (await response.json()) as T;
    } catch (error) {
      // Record failure for circuit breaker
      this.circuitBreaker.recordFailure(ML_CIRCUIT_NAME);

      if (retryCount < this.maxRetries) {
        const delayMs = this.retryDelay * Math.pow(2, retryCount);
        this.logger.warn(
          `ML request failed, retrying in ${delayMs}ms (attempt ${retryCount + 1}/${this.maxRetries})`,
          error,
        );
        await this.sleep(delayMs);
        return this.request<T>(path, options, retryCount + 1);
      }

      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      throw new MLServiceUnavailableException(
        `ML service unavailable: ${errorMsg}`,
      );
    } finally {
      clearTimeout(timeoutId);
    }
  }

  async health(): Promise<MlHealthResponse> {
    if (!this.enabled) {
      return {
        ok: false,
        model_ready: false,
        model_version: 'disabled',
      };
    }

    // Check circuit breaker state
    const circuitState = this.circuitBreaker.getState(ML_CIRCUIT_NAME);
    if (circuitState === CircuitState.OPEN) {
      this.logger.warn(
        'ML circuit breaker is OPEN, health check indicates unavailable',
      );
      return {
        ok: false,
        model_ready: false,
        model_version: 'circuit-open',
      };
    }

    try {
      return await this.circuitBreaker.execute<MlHealthResponse>(
        ML_CIRCUIT_NAME,
        () => this.request<MlHealthResponse>('/health'),
        () =>
          Promise.resolve({
            ok: false,
            model_ready: false,
            model_version: 'circuit-open',
          }),
      );
    } catch (error) {
      this.logger.error('ML health check failed', error);
      return {
        ok: false,
        model_ready: false,
        model_version: 'error',
      };
    }
  }

  async predictLive(
    sessionKey: string,
    frame: Record<string, unknown>,
    childInfo?: Record<string, string>,
  ): Promise<MlPredictResponse> {
    if (!this.enabled) {
      throw new MLServiceUnavailableException('Python ML service is disabled');
    }

    // Check circuit breaker before making request
    if (!this.circuitBreaker.isCallAllowed(ML_CIRCUIT_NAME)) {
      this.logger.warn('ML circuit breaker is OPEN, request blocked');
      throw new MLServiceUnavailableException(
        'ML service is temporarily unavailable. Please try again later.',
      );
    }

    return this.request<MlPredictResponse>('/predict/live', {
      method: 'POST',
      body: JSON.stringify({
        session_key: sessionKey,
        frame,
        child_info: childInfo,
      }),
    });
  }

  async predictWindow(
    sessionKey: string,
    frames: Record<string, unknown>[],
    childInfo?: Record<string, string>,
  ): Promise<MlPredictResponse> {
    if (!this.enabled) {
      throw new MLServiceUnavailableException('Python ML service is disabled');
    }

    // Check circuit breaker before making request
    if (!this.circuitBreaker.isCallAllowed(ML_CIRCUIT_NAME)) {
      this.logger.warn('ML circuit breaker is OPEN, request blocked');
      throw new MLServiceUnavailableException(
        'ML service is temporarily unavailable. Please try again later.',
      );
    }

    return this.request<MlPredictResponse>('/predict/window', {
      method: 'POST',
      body: JSON.stringify({
        session_key: sessionKey,
        frames,
        ...this.mapChildInfo(childInfo),
      }),
    });
  }

  async generateReport(
    sessionKey: string,
    childInfo?: Record<string, string>,
  ): Promise<ArrayBuffer> {
    if (!this.enabled) {
      throw new MLServiceUnavailableException('Python ML service is disabled');
    }

    // Check circuit breaker before making request
    if (!this.circuitBreaker.isCallAllowed(ML_CIRCUIT_NAME)) {
      this.logger.warn('ML circuit breaker is OPEN, request blocked');
      throw new MLAnalysisFailedException(
        'Report generation is temporarily unavailable. Please try again later.',
      );
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(`${this.baseUrl}/report/generate`, {
        method: 'POST',
        body: JSON.stringify({
          session_key: sessionKey,
          ...this.mapChildInfo(childInfo),
        }),
        signal: controller.signal,
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        this.circuitBreaker.recordFailure(ML_CIRCUIT_NAME);
        const text = await response.text();
        throw new MLAnalysisFailedException(
          `Report generation failed (${response.status}): ${text}`,
        );
      }

      // Record success for circuit breaker
      this.circuitBreaker.recordSuccess(ML_CIRCUIT_NAME);

      return await response.arrayBuffer();
    } catch (error) {
      if (!(error instanceof MLAnalysisFailedException)) {
        this.circuitBreaker.recordFailure(ML_CIRCUIT_NAME);
      }
      throw new MLAnalysisFailedException(
        error instanceof Error ? error.message : 'Report generation failed',
      );
    } finally {
      clearTimeout(timeoutId);
    }
  }

  async getSessionData(sessionKey: string): Promise<Record<string, unknown>> {
    if (!this.enabled) {
      throw new MLServiceUnavailableException('Python ML service is disabled');
    }

    // Check circuit breaker before making request
    if (!this.circuitBreaker.isCallAllowed(ML_CIRCUIT_NAME)) {
      this.logger.warn('ML circuit breaker is OPEN, request blocked');
      throw new MLServiceUnavailableException(
        'ML service is temporarily unavailable. Please try again later.',
      );
    }

    return this.request<Record<string, unknown>>(
      `/report/session/${sessionKey}`,
    );
  }

  /**
   * Get ML service circuit breaker status
   */
  getCircuitStatus() {
    return this.circuitBreaker.getStats(ML_CIRCUIT_NAME);
  }
}
