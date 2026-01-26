/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Test, TestingModule } from '@nestjs/testing';
import { DltConsumerService } from './dlt-consumer.service';
import { KafkaClient } from '../kafka.client';
import { kafkaConsumerGroups } from '../kafka-topics.config';

describe('DltConsumerService', () => {
  let service: DltConsumerService;
  let mockConsumer: {
    connect: jest.Mock;
    subscribe: jest.Mock;
    run: jest.Mock;
    commitOffsets: jest.Mock;
  };
  let mockProducer: { send: jest.Mock };
  let mockKafkaClient: { createConsumer: jest.Mock; getProducer: jest.Mock };

  beforeEach(async () => {
    mockConsumer = {
      connect: jest.fn().mockResolvedValue(undefined),
      subscribe: jest.fn().mockResolvedValue(undefined),
      run: jest.fn().mockResolvedValue(undefined),
      commitOffsets: jest.fn().mockResolvedValue(undefined),
    };

    mockProducer = {
      send: jest.fn().mockResolvedValue(undefined),
    };

    mockKafkaClient = {
      createConsumer: jest.fn().mockReturnValue(mockConsumer),
      getProducer: jest.fn().mockReturnValue(mockProducer),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DltConsumerService,
        { provide: KafkaClient, useValue: mockKafkaClient },
      ],
    }).compile();

    service = module.get<DltConsumerService>(DltConsumerService);
  });

  describe('onModuleInit', () => {
    it('should create consumer for dead-letter topic', async () => {
      await service.onModuleInit();

      expect(mockKafkaClient.createConsumer).toHaveBeenCalledWith(
        kafkaConsumerGroups.dltProcessor,
      );
      expect(mockConsumer.subscribe).toHaveBeenCalledWith({
        topics: ['cinema.dead-letter'],
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

    it('should re-publish message to original topic if retry count < 3', async () => {
      const mockMessage = {
        value: Buffer.from('message'),
        key: 'key1',
        offset: '10',
        headers: {
          'x-original-topic': 'cinema.reservations',
          'x-retry-count': '1',
        },
      };

      const mockPayload = {
        topic: 'cinema.dead-letter',
        partition: 0,
        message: mockMessage,
      };

      await eachMessageHandler(mockPayload);

      expect(mockProducer.send).toHaveBeenCalledWith({
        topic: 'cinema.reservations',
        messages: [
          {
            key: 'key1',
            value: Buffer.from('message'),
            headers: {
              'x-original-topic': 'cinema.reservations',
              'x-retry-count': '2',
              'x-re-published-at': expect.any(String),
            },
          },
        ],
      });
      expect(mockConsumer.commitOffsets).toHaveBeenCalled();
    });

    it('should not re-publish if retry count >= 3', async () => {
      const mockMessage = {
        value: Buffer.from('message'),
        key: 'key1',
        offset: '10',
        headers: {
          'x-original-topic': 'cinema.reservations',
          'x-retry-count': '3',
        },
      };

      const mockPayload = {
        topic: 'cinema.dead-letter',
        partition: 0,
        message: mockMessage,
      };

      await eachMessageHandler(mockPayload);

      expect(mockProducer.send).not.toHaveBeenCalled();
      expect(mockConsumer.commitOffsets).not.toHaveBeenCalled();
    });

    it('should handle missing original topic', async () => {
      const mockMessage = {
        value: Buffer.from('message'),
        key: 'key1',
        offset: '10',
        headers: {},
      };

      const mockPayload = {
        topic: 'cinema.dead-letter',
        partition: 0,
        message: mockMessage,
      };

      await eachMessageHandler(mockPayload);

      expect(mockProducer.send).not.toHaveBeenCalled();
      expect(mockConsumer.commitOffsets).not.toHaveBeenCalled();
    });
  });
});
