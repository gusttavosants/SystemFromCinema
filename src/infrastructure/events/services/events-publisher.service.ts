import { Injectable } from '@nestjs/common';
import { EventPublisherService } from '@infrastructure/messaging';
import { StructuredLoggerService } from '@infrastructure/logging';
import { v4 as uuidv4 } from 'uuid';

export interface ReservationCreatedEvent {
  reservationId: string;
  sessionId: string;
  userId: string;
  seatNumbers: number[];
  totalPriceInCents: number;
  expiresAt: Date;
  createdAt: Date;
}

export interface ReservationExpiredEvent {
  reservationId: string;
  sessionId: string;
  seatNumbers: number[];
  expiredAt: Date;
}

export interface PaymentConfirmedEvent {
  reservationId: string;
  sessionId: string;
  userId: string;
  seatNumbers: number[];
  totalPriceInCents: number;
  confirmedAt: Date;
}

export interface SeatReleasedEvent {
  sessionId: string;
  seatNumber: number;
  releasedAt: Date;
  reason: 'expired' | 'cancelled';
}

@Injectable()
export class EventsPublisherService {
  constructor(
    private readonly eventPublisher: EventPublisherService,
    private readonly logger: StructuredLoggerService,
  ) {}

  async publishReservationCreated(
    event: ReservationCreatedEvent,
  ): Promise<void> {
    try {
      const eventPayload = {
        eventId: uuidv4(),
        eventType: 'reservation.created',
        timestamp: new Date().toISOString(),
        data: event,
      };

      await this.eventPublisher.publishEvent(
        'cinema.reservations',
        'reservation.created',
        eventPayload,
      );

      this.logger.logReservationCreated(
        event.reservationId,
        event.sessionId,
        event.seatNumbers,
        {
          eventId: eventPayload.eventId,
          userId: event.userId,
          totalPrice: event.totalPriceInCents,
        },
      );
    } catch (error) {
      this.logger.error(
        `Failed to publish reservation.created event: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  async publishReservationExpired(
    event: ReservationExpiredEvent,
  ): Promise<void> {
    try {
      const eventPayload = {
        eventId: uuidv4(),
        eventType: 'reservation.expired',
        timestamp: new Date().toISOString(),
        data: event,
      };

      await this.eventPublisher.publishEvent(
        'cinema.reservations',
        'reservation.expired',
        eventPayload,
      );

      this.logger.logReservationExpired(
        event.reservationId,
        event.sessionId,
        event.seatNumbers,
        {
          eventId: eventPayload.eventId,
          expiredAt: event.expiredAt,
        },
      );
    } catch (error) {
      this.logger.error(
        `Failed to publish reservation.expired event: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  async publishPaymentConfirmed(event: PaymentConfirmedEvent): Promise<void> {
    try {
      const eventPayload = {
        eventId: uuidv4(),
        eventType: 'payment.confirmed',
        timestamp: new Date().toISOString(),
        data: event,
      };

      await this.eventPublisher.publishEvent(
        'cinema.payments',
        'payment.confirmed',
        eventPayload,
      );

      this.logger.logPaymentConfirmed(
        event.reservationId,
        event.sessionId,
        event.totalPriceInCents,
        {
          eventId: eventPayload.eventId,
          userId: event.userId,
          confirmedAt: event.confirmedAt,
        },
      );
    } catch (error) {
      this.logger.error(
        `Failed to publish payment.confirmed event: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  async publishSeatReleased(event: SeatReleasedEvent): Promise<void> {
    try {
      const eventPayload = {
        eventId: uuidv4(),
        eventType: 'seat.released',
        timestamp: new Date().toISOString(),
        data: event,
      };

      await this.eventPublisher.publishEvent(
        'cinema.reservations',
        'seat.released',
        eventPayload,
      );

      this.logger.logSeatReleased(
        event.sessionId,
        event.seatNumber,
        event.reason,
        {
          eventId: eventPayload.eventId,
          releasedAt: event.releasedAt,
        },
      );
    } catch (error) {
      this.logger.error(
        `Failed to publish seat.released event: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }
}
