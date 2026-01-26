/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Test, TestingModule } from '@nestjs/testing';
import { NotificationConsumerService } from './notification-consumer.service';
import { KafkaClient } from '../kafka.client';
import { kafkaConsumerGroups } from '../kafka-topics.config';

describe('NotificationConsumerService', () => {
  let service: NotificationConsumerService;
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
        NotificationConsumerService,
        { provide: KafkaClient, useValue: mockKafkaClient },
      ],
    }).compile();

    service = module.get<NotificationConsumerService>(
      NotificationConsumerService,
    );
  });

  describe('onModuleInit', () => {
    it('should create consumer for notifications topic', async () => {
      await service.onModuleInit();

      expect(mockKafkaClient.createConsumer).toHaveBeenCalledWith(
        kafkaConsumerGroups.notificationSenders,
      );
      expect(mockConsumer.subscribe).toHaveBeenCalledWith({
        topics: ['cinema.notifications'],
        fromBeginning: false,
      });
    });
  });

  describe('handleMessage', () => {
    let eachMessageHandler: (payload: any) => Promise<void>;

    beforeEach(async () => {
      await service.onModuleInit();

      eachMessageHandler = mockConsumer.run.mock.calls[0][0].eachMessage;
    });

    it('should process SessionCreated event and commit', async () => {
      const mockMessage = {
        value: Buffer.from(
          JSON.stringify({
            eventType: 'SessionCreated',
            data: {
              sessionId: 'sess-123',
              movieId: 'movie-456',
              startTime: new Date().toISOString(),
              availableSeats: 100,
              timestamp: new Date().toISOString(),
            },
            publishedAt: new Date().toISOString(),
          }),
        ),
        offset: '3',
      };

      const mockPayload = {
        topic: 'cinema.notifications',
        partition: 2,
        message: mockMessage,
      };

      await eachMessageHandler(mockPayload);

      expect(mockConsumer.commitOffsets).toHaveBeenCalledWith([
        {
          topic: 'cinema.notifications',
          partition: 2,
          offset: '4',
        },
      ]);
    });
  });
});
