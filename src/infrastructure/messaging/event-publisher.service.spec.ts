import { Test, TestingModule } from '@nestjs/testing';
import { EventPublisherService } from './event-publisher.service';
import { KafkaClient } from './kafka.client';
import { ReservationCreatedEvent } from '@domain/events';
import { RecordMetadata } from 'kafkajs';

describe('EventPublisherService', () => {
  let service: EventPublisherService;
  let mockProducer: { send: jest.Mock };

  beforeEach(async () => {
    mockProducer = {
      send: jest
        .fn()
        .mockResolvedValue([
          { topicName: 'test', partition: 0 } as RecordMetadata,
        ]),
    };

    const mockKafkaClient = {
      getProducer: jest.fn().mockReturnValue(mockProducer),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventPublisherService,
        { provide: KafkaClient, useValue: mockKafkaClient },
      ],
    }).compile();

    service = module.get<EventPublisherService>(EventPublisherService);
  });

  describe('publishEvent', () => {
    it('should publish a reservation created event successfully', async () => {
      const event: ReservationCreatedEvent = {
        reservationId: 'res-123',
        sessionId: 'sess-456',
        userId: 'user-789',
        seatNumber: 15,
        quantity: 2,
        totalPrice: 100,
        timestamp: new Date(),
      };

      await service.publishEvent('ReservationCreated', event);

      expect(mockProducer.send).toHaveBeenCalled();
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      const callArgs = mockProducer.send.mock.calls[0]?.[0] as {
        topic: string;
        messages: Array<{ key: string; value: string }>;
      };
      expect(callArgs.topic).toBe('events.reservations');
      expect(callArgs.messages).toHaveLength(1);
    });

    it('should include event type and timestamp in published message', async () => {
      const event: ReservationCreatedEvent = {
        reservationId: 'res-123',
        sessionId: 'sess-456',
        userId: 'user-789',
        seatNumber: 15,
        quantity: 2,
        totalPrice: 100,
        timestamp: new Date(),
      };

      await service.publishEvent('ReservationCreated', event);

      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      const callArgs = mockProducer.send.mock.calls[0]?.[0] as {
        messages: Array<{ value: string }>;
      };
      const message = callArgs.messages[0];
      const value = JSON.parse(message.value) as {
        eventType: string;
        data: unknown;
        publishedAt: string;
      };

      expect(value.eventType).toBe('ReservationCreated');
      expect(value.data).toEqual(event);
      expect(value.publishedAt).toBeDefined();
    });

    it('should use provided key for message', async () => {
      const event: ReservationCreatedEvent = {
        reservationId: 'res-123',
        sessionId: 'sess-456',
        userId: 'user-789',
        seatNumber: 15,
        quantity: 2,
        totalPrice: 100,
        timestamp: new Date(),
      };

      await service.publishEvent('ReservationCreated', event, {
        key: 'custom-key',
      });

      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      const callArgs = mockProducer.send.mock.calls[0]?.[0] as {
        messages: Array<{ key: string }>;
      };
      const message = callArgs.messages[0];
      expect(message.key).toBe('custom-key');
    });

    it('should publish payment confirmed event to payments topic', async () => {
      const event = {
        paymentId: 'pay-123',
        reservationId: 'res-456',
        amount: 100,
        method: 'credit_card',
        timestamp: new Date(),
      };

      await service.publishEvent('PaymentConfirmed', event);

      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      const callArgs = mockProducer.send.mock.calls[0]?.[0] as {
        topic: string;
      };
      expect(callArgs.topic).toBe('events.payments');
    });

    it('should publish session created event to sessions topic', async () => {
      const event = {
        sessionId: 'sess-123',
        movieId: 'movie-456',
        startTime: new Date(),
        availableSeats: 100,
        timestamp: new Date(),
      };

      await service.publishEvent('SessionCreated', event);

      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      const callArgs = mockProducer.send.mock.calls[0]?.[0] as {
        topic: string;
      };
      expect(callArgs.topic).toBe('events.sessions');
    });

    it('should throw error if producer send fails', async () => {
      const event: ReservationCreatedEvent = {
        reservationId: 'res-123',
        sessionId: 'sess-456',
        userId: 'user-789',
        seatNumber: 15,
        quantity: 2,
        totalPrice: 100,
        timestamp: new Date(),
      };

      mockProducer.send.mockRejectedValueOnce(new Error('Kafka error'));

      await expect(
        service.publishEvent('ReservationCreated', event),
      ).rejects.toThrow('Kafka error');
    });

    it('should handle unknown event types by mapping to lowercase topic', async () => {
      const event = {
        customEventId: 'custom-123',
        timestamp: new Date(),
      };

      await service.publishEvent('CustomEvent', event as never);

      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      const callArgs = mockProducer.send.mock.calls[0]?.[0] as {
        topic: string;
      };
      expect(callArgs.topic).toBe('events.customevent');
    });
  });

  describe('publish', () => {
    it('should publish raw messages to specified topic', async () => {
      const messages = [
        {
          key: 'key-1',
          value: 'message-1',
        },
      ];

      await service.publish('test-topic', messages);

      expect(mockProducer.send).toHaveBeenCalledWith({
        topic: 'test-topic',
        messages,
        timeout: 30000,
      });
    });

    it('should use custom timeout if provided', async () => {
      const messages = [{ key: 'key-1', value: 'message-1' }];

      await service.publish('test-topic', messages, 5000);

      expect(mockProducer.send).toHaveBeenCalledWith({
        topic: 'test-topic',
        messages,
        timeout: 5000,
      });
    });

    it('should throw error if producer send fails', async () => {
      const messages = [{ key: 'key-1', value: 'message-1' }];

      mockProducer.send.mockRejectedValueOnce(new Error('Send failed'));

      await expect(service.publish('test-topic', messages)).rejects.toThrow(
        'Send failed',
      );
    });

    it('should handle multiple messages', async () => {
      const messages = [
        { key: 'key-1', value: 'message-1' },
        { key: 'key-2', value: 'message-2' },
        { key: 'key-3', value: 'message-3' },
      ];

      await service.publish('test-topic', messages);

      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      const callArgs = mockProducer.send.mock.calls[0]?.[0] as {
        messages: Array<{ key: string }>;
      };
      expect(callArgs.messages).toHaveLength(3);
    });
  });
});
