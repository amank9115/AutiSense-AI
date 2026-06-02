import { Injectable, Logger } from '@nestjs/common';

export enum CircuitState {
  CLOSED = 'CLOSED',
  OPEN = 'OPEN',
  HALF_OPEN = 'HALF_OPEN',
}

export interface CircuitConfig {
  failureThreshold: number;
  successThreshold: number;
  timeout: number; // milliseconds
}

interface CircuitData {
  state: CircuitState;
  failures: number;
  successes: number;
  lastFailureTime: number;
  nextAttemptTime: number;
}

const DEFAULT_CONFIG: CircuitConfig = {
  failureThreshold: 5,
  successThreshold: 2,
  timeout: 60000, // 1 minute
};

@Injectable()
export class CircuitBreakerService {
  private readonly logger = new Logger(CircuitBreakerService.name);
  private readonly circuits = new Map<string, CircuitData>();
  private readonly configs = new Map<string, CircuitConfig>();

  /**
   * Get or create a circuit breaker for a service
   */
  getCircuit(name: string, config?: Partial<CircuitConfig>): CircuitData {
    if (!this.circuits.has(name)) {
      const circuitConfig = {
        ...DEFAULT_CONFIG,
        ...config,
      };
      this.configs.set(name, circuitConfig);
      this.circuits.set(name, {
        state: CircuitState.CLOSED,
        failures: 0,
        successes: 0,
        lastFailureTime: 0,
        nextAttemptTime: 0,
      });
    }
    return this.circuits.get(name)!;
  }

  /**
   * Record a successful call
   */
  recordSuccess(name: string): void {
    const circuit = this.getCircuit(name);
    circuit.failures = 0;

    if (circuit.state === CircuitState.HALF_OPEN) {
      circuit.successes++;
      const config = this.configs.get(name)!;

      if (circuit.successes >= config.successThreshold) {
        this.transitionTo(name, CircuitState.CLOSED);
        this.logger.log(`Circuit ${name} closed (recovered after ${circuit.successes} successful calls)`);
      }
    } else {
      circuit.successes = 1;
    }
  }

  /**
   * Record a failed call
   */
  recordFailure(name: string): void {
    const circuit = this.getCircuit(name);
    const config = this.configs.get(name)!;

    circuit.failures++;
    circuit.lastFailureTime = Date.now();

    if (circuit.state === CircuitState.HALF_OPEN) {
      // In HALF_OPEN, any failure immediately opens the circuit
      this.transitionTo(name, CircuitState.OPEN);
      this.logger.warn(`Circuit ${name} reopened due to failure in HALF_OPEN state`);
    } else if (circuit.failures >= config.failureThreshold) {
      // Threshold reached, open the circuit
      this.transitionTo(name, CircuitState.OPEN);
      this.logger.warn(`Circuit ${name} opened after ${circuit.failures} consecutive failures`);
    }
  }

  /**
   * Check if a circuit allows requests
   */
  isCallAllowed(name: string): boolean {
    const circuit = this.getCircuit(name);

    if (circuit.state === CircuitState.CLOSED) {
      return true;
    }

    if (circuit.state === CircuitState.OPEN) {
      const config = this.configs.get(name)!;
      const now = Date.now();

      // Check if timeout has passed, transition to HALF_OPEN
      if (now >= circuit.nextAttemptTime) {
        this.transitionTo(name, CircuitState.HALF_OPEN);
        return true;
      }

      return false;
    }

    // In HALF_OPEN state, allow one test request
    return true;
  }

  /**
   * Get current state of a circuit
   */
  getState(name: string): CircuitState {
    const circuit = this.getCircuit(name);

    // Check for automatic transition from OPEN to HALF_OPEN
    if (circuit.state === CircuitState.OPEN) {
      const config = this.configs.get(name)!;
      if (Date.now() >= circuit.nextAttemptTime) {
        this.transitionTo(name, CircuitState.HALF_OPEN);
      }
    }

    return circuit.state;
  }

  /**
   * Get circuit statistics
   */
  getStats(name: string): {
    state: CircuitState;
    failures: number;
    successes: number;
    lastFailureTime: number;
    nextAttemptTime: number;
    config: CircuitConfig;
  } {
    const circuit = this.getCircuit(name);
    const config = this.configs.get(name)!;

    return {
      state: this.getState(name),
      failures: circuit.failures,
      successes: circuit.successes,
      lastFailureTime: circuit.lastFailureTime,
      nextAttemptTime: circuit.nextAttemptTime,
      config,
    };
  }

  /**
   * Execute a function with circuit breaker protection
   */
  async execute<T>(
    name: string,
    fn: () => Promise<T>,
    fallback: () => Promise<T>,
    config?: Partial<CircuitConfig>,
  ): Promise<T> {
    if (!this.isCallAllowed(name)) {
      this.logger.debug(`Circuit ${name} is OPEN, using fallback`);
      return fallback();
    }

    try {
      const result = await fn();
      this.recordSuccess(name);
      return result;
    } catch (error) {
      this.recordFailure(name);
      this.logger.warn(`Circuit ${name} request failed, trying fallback`);
      return fallback();
    }
  }

  /**
   * Reset a circuit to closed state (e.g., for testing)
   */
  reset(name: string): void {
    if (this.circuits.has(name)) {
      this.circuits.delete(name);
      this.configs.delete(name);
    }
  }

  /**
   * Reset all circuits
   */
  resetAll(): void {
    this.circuits.clear();
    this.configs.clear();
  }

  private transitionTo(name: string, newState: CircuitState): void {
    const circuit = this.getCircuit(name);
    const config = this.configs.get(name)!;
    const oldState = circuit.state;

    circuit.state = newState;

    if (newState === CircuitState.OPEN) {
      circuit.nextAttemptTime = Date.now() + config.timeout;
    } else if (newState === CircuitState.HALF_OPEN) {
      circuit.nextAttemptTime = 0;
      circuit.failures = 0;
      circuit.successes = 0;
    } else if (newState === CircuitState.CLOSED) {
      circuit.failures = 0;
      circuit.successes = 0;
      circuit.nextAttemptTime = 0;
    }

    this.logger.debug(`Circuit ${name} transition: ${oldState} -> ${newState}`);
  }
}