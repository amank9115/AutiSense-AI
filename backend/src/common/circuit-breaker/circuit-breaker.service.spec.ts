import { CircuitBreakerService, CircuitState } from './circuit-breaker.service';

describe('CircuitBreakerService', () => {
  let service: CircuitBreakerService;

  beforeEach(() => {
    service = new CircuitBreakerService();
  });

  afterEach(() => {
    service.resetAll();
  });

  describe('initial state', () => {
    it('should be CLOSED initially', () => {
      service.getCircuit('test-service');

      expect(service.getState('test-service')).toBe(CircuitState.CLOSED);
    });

    it('should record stats for new circuit', () => {
      const stats = service.getStats('new-service');

      expect(stats.state).toBe(CircuitState.CLOSED);
      expect(stats.failures).toBe(0);
      expect(stats.successes).toBe(0);
      expect(stats.config).toBeDefined();
    });
  });

  describe('recordSuccess', () => {
    it('should reset failure count on success', () => {
      service.getCircuit('test-service');
      service.recordFailure('test-service');
      expect(service.getStats('test-service').failures).toBe(1);

      service.recordSuccess('test-service');

      expect(service.getStats('test-service').failures).toBe(0);
    });

    it('should not transition from CLOSED on single success', () => {
      service.getCircuit('test-service');
      service.recordSuccess('test-service');

      expect(service.getState('test-service')).toBe(CircuitState.CLOSED);
    });
  });

  describe('recordFailure', () => {
    it('should increment failure count', () => {
      service.getCircuit('test-service');
      service.recordFailure('test-service');
      service.recordFailure('test-service');

      expect(service.getStats('test-service').failures).toBe(2);
    });

    it('should transition to OPEN when threshold reached', () => {
      service.getCircuit('test-service', { failureThreshold: 3 });

      service.recordFailure('test-service');
      service.recordFailure('test-service');
      service.recordFailure('test-service');

      expect(service.getState('test-service')).toBe(CircuitState.OPEN);
    });

    it('should stay CLOSED when below threshold', () => {
      service.getCircuit('test-service', { failureThreshold: 5 });

      service.recordFailure('test-service');
      service.recordFailure('test-service');

      expect(service.getState('test-service')).toBe(CircuitState.CLOSED);
    });

    it('should transition from HALF_OPEN to OPEN on failure', () => {
      service.getCircuit('test-service', { failureThreshold: 3, timeout: 1 });

      // Force to HALF_OPEN by reaching threshold then waiting
      service.recordFailure('test-service');
      service.recordFailure('test-service');
      service.recordFailure('test-service'); // Now OPEN

      // Simulate timeout by using a very short timeout
      service.getCircuit('test-service', { failureThreshold: 3, timeout: 1 });
      (service.getStats('test-service') as any).lastFailureTime =
        Date.now() - 100; // In the past

      // Allow one success to transition to HALF_OPEN
      service.recordFailure('test-service'); // From HALF_OPEN = back to OPEN

      expect(service.getState('test-service')).toBe(CircuitState.OPEN);
    });
  });

  describe('isCallAllowed', () => {
    it('should allow calls when CLOSED', () => {
      service.getCircuit('test-service');

      expect(service.isCallAllowed('test-service')).toBe(true);
    });

    it('should block calls when OPEN and timeout not reached', () => {
      service.getCircuit('test-service', {
        failureThreshold: 1,
        timeout: 60000,
      });
      service.recordFailure('test-service');

      expect(service.isCallAllowed('test-service')).toBe(false);
    });

    it('should allow calls when timeout reached (transition to HALF_OPEN)', () => {
      service.getCircuit('test-service', { failureThreshold: 1, timeout: 1 });
      service.recordFailure('test-service'); // Now OPEN

      // Simulate time passing
      (service.getStats('test-service') as any).nextAttemptTime =
        Date.now() - 1000;

      expect(service.isCallAllowed('test-service')).toBe(
        CircuitState.HALF_OPEN,
      );
    });

    it('should allow calls in HALF_OPEN state', () => {
      service.getCircuit('test-service', { timeout: 1 });
      (service.getStats('test-service') as any).state = CircuitState.HALF_OPEN;

      expect(service.isCallAllowed('test-service')).toBe(true);
    });
  });

  describe('execute', () => {
    it('should execute function when circuit is CLOSED', async () => {
      service.getCircuit('test-service');
      const fn = jest.fn().mockResolvedValue('success');

      const result = await service.execute('test-service', fn, jest.fn());

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalled();
    });

    it('should call fallback when circuit is OPEN', async () => {
      service.getCircuit('test-service', {
        failureThreshold: 1,
        timeout: 60000,
      });
      service.recordFailure('test-service'); // Now OPEN

      const fn = jest.fn();
      const fallback = jest.fn().mockResolvedValue('fallback');

      const result = await service.execute('test-service', fn, fallback);

      expect(result).toBe('fallback');
      expect(fn).not.toHaveBeenCalled();
      expect(fallback).toHaveBeenCalled();
    });

    it('should record success after successful execution', async () => {
      service.getCircuit('test-service');
      const fn = jest.fn().mockResolvedValue('success');

      await service.execute('test-service', fn, jest.fn());

      expect(service.getStats('test-service').failures).toBe(0);
    });

    it('should record failure after failed execution', async () => {
      service.getCircuit('test-service');
      const fn = jest.fn().mockRejectedValue(new Error('failed'));
      const fallback = jest.fn().mockResolvedValue('fallback');

      await service.execute('test-service', fn, fallback);

      expect(service.getStats('test-service').failures).toBe(1);
    });

    it('should use fallback and not throw when function fails', async () => {
      service.getCircuit('test-service');
      const fn = jest.fn().mockRejectedValue(new Error('API error'));
      const fallback = jest.fn().mockResolvedValue('fallback');

      const result = await service.execute('test-service', fn, fallback);

      expect(result).toBe('fallback');
    });
  });

  describe('recovery from HALF_OPEN', () => {
    it('should transition to CLOSED after success threshold in HALF_OPEN', () => {
      service.getCircuit('test-service', { successThreshold: 2 });

      // First success in HALF_OPEN
      service.recordSuccess('test-service');
      expect(service.getState('test-service')).toBe(CircuitState.HALF_OPEN);

      // Second success transitions to CLOSED
      service.recordSuccess('test-service');
      expect(service.getState('test-service')).toBe(CircuitState.CLOSED);
    });

    it('should reset failures when transitioning to CLOSED', () => {
      service.getCircuit('test-service', {
        successThreshold: 1,
        failureThreshold: 3,
      });

      // Add some failures
      service.recordFailure('test-service');
      service.recordFailure('test-service');

      // Success transitions to CLOSED
      service.recordSuccess('test-service');

      // Failures should be reset
      expect(service.getStats('test-service').failures).toBe(0);
    });
  });

  describe('reset', () => {
    it('should remove circuit from tracking', () => {
      service.getCircuit('test-service');
      service.recordFailure('test-service');

      service.reset('test-service');

      // Should create new circuit on next access
      service.getCircuit('test-service');
      expect(service.getStats('test-service').failures).toBe(0);
    });
  });

  describe('resetAll', () => {
    it('should remove all circuits', () => {
      service.getCircuit('service-1');
      service.getCircuit('service-2');
      service.recordFailure('service-1');
      service.recordFailure('service-2');

      service.resetAll();

      expect(service.getStats('service-1').failures).toBe(0);
      expect(service.getStats('service-2').failures).toBe(0);
    });
  });

  describe('custom configuration', () => {
    it('should use custom config values', () => {
      const customConfig = {
        failureThreshold: 10,
        successThreshold: 5,
        timeout: 120000,
      };

      service.getCircuit('custom-service', customConfig);
      const stats = service.getStats('custom-service');

      expect(stats.config.failureThreshold).toBe(10);
      expect(stats.config.successThreshold).toBe(5);
      expect(stats.config.timeout).toBe(120000);
    });

    it('should use defaults for unspecified config values', () => {
      service.getCircuit('partial-service', { failureThreshold: 10 });
      const stats = service.getStats('partial-service');

      expect(stats.config.failureThreshold).toBe(10);
      expect(stats.config.successThreshold).toBe(2); // default
    });
  });
});
