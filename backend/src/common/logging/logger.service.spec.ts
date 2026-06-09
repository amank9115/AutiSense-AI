import { Test, TestingModule } from '@nestjs/testing';
import * as winston from 'winston';
import { LoggerService } from './logger.service';

describe('LoggerService', () => {
  let service: LoggerService;
  let mockWinstonLogger: jest.Mocked<winston.Logger>;

  beforeEach(() => {
    mockWinstonLogger = {
      debug: jest.fn(),
      error: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      verbose: jest.fn(),
    } as any;

    service = new LoggerService(mockWinstonLogger);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('log', () => {
    it('should call winston info method', () => {
      const message = 'Test message';
      const context = 'TestContext';

      service.log(message, context);

      expect(mockWinstonLogger.info).toHaveBeenCalledWith(
        message,
        expect.objectContaining({ context }),
      );
    });
  });

  describe('error', () => {
    it('should call winston error method with error message', () => {
      const message = 'Error message';
      const error = new Error('Test error');
      const context = 'ErrorContext';

      service.error(message, error, context);

      expect(mockWinstonLogger.error).toHaveBeenCalledWith(
        error.message,
        expect.objectContaining({
          context,
          stack: error.stack,
        }),
      );
    });
  });

  describe('warn', () => {
    it('should call winston warn method', () => {
      const message = 'Warning message';
      const context = 'WarnContext';

      service.warn(message, context);

      expect(mockWinstonLogger.warn).toHaveBeenCalledWith(
        message,
        expect.objectContaining({ context }),
      );
    });
  });

  describe('debug', () => {
    it('should call winston debug method', () => {
      const message = 'Debug message';
      const context = 'DebugContext';

      service.debug(message, context);

      expect(mockWinstonLogger.debug).toHaveBeenCalledWith(
        message,
        expect.objectContaining({ context }),
      );
    });
  });

  describe('info', () => {
    it('should call log method', () => {
      const message = 'Info message';
      const context = 'InfoContext';
      jest.spyOn(service, 'log');

      service.info(message, context);

      expect(service.log).toHaveBeenCalledWith(message, context);
    });
  });
});
