/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Test, TestingModule } from '@nestjs/testing';
import { ReservationConsumerService } from './reservation-consumer.service';
import { KafkaClient } from '../kafka.client';
import { kafkaConsumerGroups } from '../kafka-topics.config';

describe('ReservationConsumerService', () => {
  let service: ReservationConsumerService;
  let mockConsumer: {
    connect: jest.Mock;
    subscribe: jest.Mock;
    run: jest.Mock;
    commitOffsets: jest.Mock;
  };
  let mockKafkaClient: { createConsumer: jest.Mock };

  beforeEach(async () => {
    mockConsumer = {
      connect: jest.fn().mockResolvedValue(undefined),
      subscribe: jest.fn().mockResolvedValue(undefined),
      run: jest.fn().mockResolvedValue(undefined),
      commitOffsets: jest.fn().mockResolvedValue(undefined),
    };

    mockKafkaClient = {
      createConsumer: jest.fn().mockReturnValue(mockConsumer),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReservationConsumerService,
        { provide: KafkaClient, useValue: mockKafkaClient },
      ],
    }).compile();

    service = module.get<ReservationConsumerService>(
      ReservationConsumerService,
    );
  });

  describe('onModuleInit', () => {
    it('should create consumer, connect, subscribe and run', async () => {
      await service.onModuleInit();

      expect(mockKafkaClient.createConsumer).toHaveBeenCalledWith(
        kafkaConsumerGroups.reservationProcessors,
      );
      expect(mockConsumer.connect).toHaveBeenCalled();
      expect(mockConsumer.subscribe).toHaveBeenCalledWith({
        topics: ['cinema.reservations'],
        fromBeginning: false,
      });
      expect(mockConsumer.run).toHaveBeenCalledWith({
        eachMessage: expect.any(Function),
      });
    });

    it('should throw error if connection fails', async () => {
      mockConsumer.connect.mockRejectedValueOnce(
        new Error('Connection failed'),
      );

      await expect(service.onModuleInit()).rejects.toThrow('Connection failed');
    });
  });

  describe('handleMessage', () => {
    let eachMessageHandler: (payload: any) => Promise<void>;

    beforeEach(async () => {
      await service.onModuleInit();

      eachMessageHandler = mockConsumer.run.mock.calls[0][0].eachMessage;
    });

    it('should process valid message and commit offset', async () => {
      const mockMessage = {
        value: Buffer.from(
          JSON.stringify({
            eventType: 'ReservationCreated',
            data: {
              reservationId: 'res-123',
              sessionId: 'sess-456',
              userId: 'user-789',
              seatNumber: 1,
              quantity: 1,
              totalPrice: 10,
              timestamp: new Date().toISOString(),
            },
            publishedAt: new Date().toISOString(),
          }),
        ),
        offset: '10',
      };

      const mockPayload = {
        topic: 'cinema.reservations',
        partition: 0,
        message: mockMessage,
      };

      await eachMessageHandler(mockPayload);

      expect(mockConsumer.commitOffsets).toHaveBeenCalledWith([
        {
          topic: 'cinema.reservations',
          partition: 0,
          offset: '11', // offset + 1
        },
      ]);
    });

    it('should skip messages with null value', async () => {
      const mockMessage = {
        value: null,
        offset: '10',
      };

      const mockPayload = {
        topic: 'cinema.reservations',
        partition: 0,
        message: mockMessage,
      };

      await eachMessageHandler(mockPayload);

      expect(mockConsumer.commitOffsets).not.toHaveBeenCalled();
    });

    it('should throw error on invalid JSON', async () => {
      const mockMessage = {
        value: Buffer.from('invalid json'),
        offset: '10',
      };

      const mockPayload = {
        topic: 'cinema.reservations',
        partition: 0,
        message: mockMessage,
      };

      await expect(eachMessageHandler(mockPayload)).rejects.toThrow();
      expect(mockConsumer.commitOffsets).not.toHaveBeenCalled();
    });

    it('should handle unknown event types', async () => {
      const mockMessage = {
        value: Buffer.from(
          JSON.stringify({
            eventType: 'UnknownEvent',
            data: {},
            publishedAt: new Date().toISOString(),
          }),
        ),
        offset: '10',
      };

      const mockPayload = {
        topic: 'cinema.reservations',
        partition: 0,
        message: mockMessage,
      };

      await eachMessageHandler(mockPayload);

      expect(mockConsumer.commitOffsets).toHaveBeenCalled();
    });
  });
});
