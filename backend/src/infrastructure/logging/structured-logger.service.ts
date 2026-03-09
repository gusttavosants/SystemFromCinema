import { Injectable, LoggerService, LogLevel } from '@nestjs/common';
import * as winston from 'winston';

export interface LogContext {
  eventId?: string;
  eventType?: string;
  reservationId?: string;
  sessionId?: string;
  userId?: string;
  seatNumbers?: number[];
  correlationId?: string;
  [key: string]: unknown;
}

@Injectable()
export class StructuredLoggerService implements LoggerService {
  private logger: winston.Logger;

  constructor() {
    this.logger = winston.createLogger({
      level: process.env.LOG_LEVEL || 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json(),
      ),
      defaultMeta: { service: 'cinema-booking-api' },
      transports: [
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.timestamp(),
            winston.format.printf(({ timestamp, level, message, ...meta }) => {
              // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
              return `${timestamp} [${level}]: ${String(message)} ${Object.keys(meta).length ? JSON.stringify(meta) : ''}`;
            }),
          ),
        }),
        ...(process.env.NODE_ENV === 'production'
          ? [
              new winston.transports.File({
                filename: 'logs/error.log',
                level: 'error',
              }),
              new winston.transports.File({
                filename: 'logs/combined.log',
              }),
            ]
          : []),
      ],
    });
  }

  log(message: any, context?: LogContext): void {
    this.logger.info(String(message), context);
  }

  error(message: any, trace?: string, context?: LogContext): void {
    const level = 'error';
    const meta = { trace, ...context };
    this.logger.log(level, String(message), meta);
  }

  warn(message: any, context?: LogContext): void {
    this.logger.warn(String(message), context);
  }

  debug(message: any, context?: LogContext): void {
    this.logger.debug(String(message), context);
  }

  verbose(message: any, context?: LogContext): void {
    this.logger.verbose(String(message), context);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  setLogLevels?(_levels: LogLevel[]): void {
    // Not implemented for Winston
  }

  // Métodos específicos para eventos
  logEventPublished(
    eventType: string,
    eventId: string,
    context?: LogContext,
  ): void {
    this.logger.info(`Event published: ${eventType}`, {
      eventId,
      eventType,
      action: 'event_published',
      ...context,
    });
  }

  logEventProcessed(
    eventType: string,
    eventId: string,
    context?: LogContext,
  ): void {
    this.logger.info(`Event processed: ${eventType}`, {
      eventId,
      eventType,
      action: 'event_processed',
      ...context,
    });
  }

  logEventSkipped(
    eventType: string,
    eventId: string,
    reason: string,
    context?: LogContext,
  ): void {
    this.logger.info(`Event skipped: ${eventType} - ${reason}`, {
      eventId,
      eventType,
      action: 'event_skipped',
      reason,
      ...context,
    });
  }

  logReservationCreated(
    reservationId: string,
    sessionId: string,
    seatNumbers: number[],
    context?: LogContext,
  ): void {
    this.logger.info('Reservation created', {
      reservationId,
      sessionId,
      seatNumbers,
      action: 'reservation_created',
      ...context,
    });
  }

  logReservationExpired(
    reservationId: string,
    sessionId: string,
    seatNumbers: number[],
    context?: LogContext,
  ): void {
    this.logger.info('Reservation expired', {
      reservationId,
      sessionId,
      seatNumbers,
      action: 'reservation_expired',
      ...context,
    });
  }

  logPaymentConfirmed(
    reservationId: string,
    sessionId: string,
    totalPrice: number,
    context?: LogContext,
  ): void {
    this.logger.info('Payment confirmed', {
      reservationId,
      sessionId,
      totalPrice,
      action: 'payment_confirmed',
      ...context,
    });
  }

  logSeatReleased(
    sessionId: string,
    seatNumber: number,
    reason: string,
    context?: LogContext,
  ): void {
    this.logger.info('Seat released', {
      sessionId,
      seatNumber,
      reason,
      action: 'seat_released',
      ...context,
    });
  }

  logLockAcquired(
    resource: string,
    lockToken: string,
    context?: LogContext,
  ): void {
    this.logger.debug('Lock acquired', {
      resource,
      lockToken,
      action: 'lock_acquired',
      ...context,
    });
  }

  logLockReleased(
    resource: string,
    lockToken: string,
    context?: LogContext,
  ): void {
    this.logger.debug('Lock released', {
      resource,
      lockToken,
      action: 'lock_released',
      ...context,
    });
  }

  logLockFailed(resource: string, error: string, context?: LogContext): void {
    this.logger.warn('Lock acquisition failed', {
      resource,
      error,
      action: 'lock_failed',
      ...context,
    });
  }
}
