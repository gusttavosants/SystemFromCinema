/* eslint-disable @typescript-eslint/no-unsafe-assignment */

/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/require-await */
import { Test, TestingModule } from '@nestjs/testing';
import { EventsPublisherService } from './services/events-publisher.service';
import { EventsSubscriberService } from './services/events-subscriber.service';
import { IdempotencyService } from './services/idempotency.service';
import { ReservationExpirationWorker } from './services/reservation-expiration.worker';
import { StructuredLoggerService } from '@infrastructure/logging';
import { EventPublisherService } from '@infrastructure/messaging';

describe('EventsModule Integration', () => {
  let eventsPublisher: EventsPublisherService;
  let idempotencyService: IdempotencyService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventsPublisherService,
        IdempotencyService,
        StructuredLoggerService,
        {
          provide: EventPublisherService,
          useValue: {
            publishEvent: jest.fn(),
          },
        },
      ],
    }).compile();

    eventsPublisher = module.get<EventsPublisherService>(
      EventsPublisherService,
    );
    idempotencyService = module.get<IdempotencyService>(IdempotencyService);
  });

  describe('Event Publishing', () => {
    it('should publish reservation.created event with correct payload', async () => {
      const eventPublisherMock = {
        publishEvent: jest.fn().mockResolvedValue(undefined),
      };

      const module = await Test.createTestingModule({
        providers: [
          EventsPublisherService,
          StructuredLoggerService,
          {
            provide: EventPublisherService,
            useValue: eventPublisherMock,
          },
        ],
      }).compile();

      const publisher = module.get<EventsPublisherService>(
        EventsPublisherService,
      );

      const event = {
        reservationId: 'res-123',
        sessionId: 'sess-456',
        userId: 'user-789',
        seatNumbers: [1, 2, 3],
        totalPriceInCents: 3000,
        expiresAt: new Date('2024-01-01T10:00:00Z'),
        createdAt: new Date('2024-01-01T09:00:00Z'),
      };

      await publisher.publishReservationCreated(event);

      expect(eventPublisherMock.publishEvent).toHaveBeenCalledWith(
        'cinema.reservations',
        'reservation.created',
        expect.objectContaining({
          eventType: 'reservation.created',
          data: event,
        }),
      );
    });

    it('should publish payment.confirmed event with correct payload', async () => {
      const eventPublisherMock = {
        publishEvent: jest.fn().mockResolvedValue(undefined),
      };

      const module = await Test.createTestingModule({
        providers: [
          EventsPublisherService,
          StructuredLoggerService,
          {
            provide: EventPublisherService,
            useValue: eventPublisherMock,
          },
        ],
      }).compile();

      const publisher = module.get<EventsPublisherService>(
        EventsPublisherService,
      );

      const event = {
        reservationId: 'res-123',
        sessionId: 'sess-456',
        userId: 'user-789',
        seatNumbers: [1, 2, 3],
        totalPriceInCents: 3000,
        confirmedAt: new Date('2024-01-01T10:00:00Z'),
      };

      await publisher.publishPaymentConfirmed(event);

      expect(eventPublisherMock.publishEvent).toHaveBeenCalledWith(
        'cinema.payments',
        'payment.confirmed',
        expect.objectContaining({
          eventType: 'payment.confirmed',
          data: event,
        }),
      );
    });

    it('should publish seat.released events for each seat', async () => {
      const eventPublisherMock = {
        publishEvent: jest.fn().mockResolvedValue(undefined),
      };

      const module = await Test.createTestingModule({
        providers: [
          EventsPublisherService,
          StructuredLoggerService,
          {
            provide: EventPublisherService,
            useValue: eventPublisherMock,
          },
        ],
      }).compile();

      const publisher = module.get<EventsPublisherService>(
        EventsPublisherService,
      );

      await publisher.publishSeatReleased({
        sessionId: 'sess-456',
        seatNumber: 5,
        releasedAt: new Date('2024-01-01T10:00:00Z'),
        reason: 'expired',
      });

      expect(eventPublisherMock.publishEvent).toHaveBeenCalledWith(
        'cinema.reservations',
        'seat.released',
        expect.objectContaining({
          eventType: 'seat.released',
          data: expect.objectContaining({
            sessionId: 'sess-456',
            seatNumber: 5,
            reason: 'expired',
          }),
        }),
      );
    });
  });

  describe('Idempotency', () => {
    it('should process event only once', async () => {
      const eventId = 'test-event-123';
      let callCount = 0;

      const result1 = await idempotencyService.processEventIdempotently(
        eventId,
        async () => {
          callCount++;
          return 'result1';
        },
      );

      const result2 = await idempotencyService.processEventIdempotently(
        eventId,
        async () => {
          callCount++;
          return 'result2';
        },
      );

      expect(callCount).toBe(1);
      expect(result1.processed).toBe(true);
      expect(result1.result).toBe('result1');
      expect(result2.processed).toBe(false);
      expect(result2.result).toBeUndefined();
    });

    it('should handle event processing errors', async () => {
      const eventId = 'error-event-123';

      await expect(
        idempotencyService.processEventIdempotently(eventId, async () => {
          throw new Error('Processing failed');
        }),
      ).rejects.toThrow('Processing failed');
    });
  });

  describe('Reservation Expiration Worker', () => {
    it('should check expired reservations periodically', async () => {
      const cancelExpiredReservationsMock = {
        execute: jest.fn().mockResolvedValue({ cancelledCount: 2 }),
      };

      const module = await Test.createTestingModule({
        providers: [
          ReservationExpirationWorker,
          StructuredLoggerService,
          {
            provide: CancelExpiredReservationsUseCase,
            useValue: cancelExpiredReservationsMock,
          },
        ],
      }).compile();

      const worker = module.get<ReservationExpirationWorker>(
        ReservationExpirationWorker,
      );

      await worker.checkExpiredReservations();

      expect(cancelExpiredReservationsMock.execute).toHaveBeenCalled();
    });
  });
});
