import { Module } from '@nestjs/common';
import * as winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import { LoggerService } from './logger.service';

@Module({
  providers: [
    {
      provide: 'WINSTON_LOGGER',
      useFactory: () => {
        const isDevelopment = process.env.NODE_ENV !== 'production';
        const isTest = process.env.NODE_ENV === 'test';

        const format = isDevelopment
          ? winston.format.combine(
              winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
              winston.format.errors({ stack: true }),
              winston.format.colorize({ all: true }),
              winston.format.printf(
                ({ level, message, timestamp, stack, context, ...meta }) => {
                  const metaStr = Object.keys(meta).length
                    ? ` ${JSON.stringify(meta, null, 2)}`
                    : '';
                  const contextStr =
                    typeof context === 'string' ? ` [${context}]` : '';
                  const stackStr =
                    typeof stack === 'string' ? `\n${stack}` : '';
                  return `${String(timestamp)} [${String(level)}]${contextStr}: ${String(message)}${metaStr}${stackStr}`;
                },
              ),
            )
          : winston.format.combine(
              winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
              winston.format.errors({ stack: true }),
              winston.format.json(),
            );

        const transports: winston.transport[] = [];

        // Always add console transport
        if (!isTest) {
          transports.push(
            new winston.transports.Console({
              format: isDevelopment
                ? format
                : winston.format.combine(
                    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
                    winston.format.colorize({ all: true }),
                    winston.format.printf(
                      ({ level, message, timestamp, context }) => {
                        const contextStr =
                          typeof context === 'string' ? ` [${context}]` : '';
                        return `${String(timestamp)} [${String(level)}]${contextStr}: ${String(message)}`;
                      },
                    ),
                  ),
            }),
          );
        }

        // File transports (not for test environment)
        if (!isTest) {
          // All logs file
          transports.push(
            new DailyRotateFile({
              filename: 'logs/app-%DATE%.log',
              datePattern: 'YYYY-MM-DD',
              maxSize: '20m',
              level: 'debug',
              format: isDevelopment ? format : winston.format.json(),
            }),
          );

          // Error logs file
          transports.push(
            new DailyRotateFile({
              filename: 'logs/error-%DATE%.log',
              datePattern: 'YYYY-MM-DD',
              maxSize: '20m',
              level: 'error',
              format: isDevelopment ? format : winston.format.json(),
            }),
          );
        }

        return winston.createLogger({
          level: isTest
            ? 'debug'
            : process.env.LOG_LEVEL || (isDevelopment ? 'debug' : 'info'),
          format,
          transports,
          exitOnError: false,
        });
      },
    },
    {
      provide: LoggerService,
      useFactory: (winstonLogger: winston.Logger) =>
        new LoggerService(winstonLogger),
      inject: ['WINSTON_LOGGER'],
    },
  ],
  exports: [LoggerService],
})
export class LoggerModule {}
