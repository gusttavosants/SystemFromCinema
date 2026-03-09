/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Test, TestingModule } from '@nestjs/testing';
import { PaymentConsumerService } from './payment-consumer.service';
import { KafkaClient } from '../kafka.client';
import { kafkaConsumerGroups } from '../kafka-topics.config';

describe('PaymentConsumerService', () => {
  let service: PaymentConsumerService;
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
        PaymentConsumerService,
        { provide: KafkaClient, useValue: mockKafkaClient },
      ],
    }).compile();

    service = module.get<PaymentConsumerService>(PaymentConsumerService);
  });

  describe('onModuleInit', () => {
    it('should create consumer for payments topic', async () => {
      await service.onModuleInit();

      expect(mockKafkaClient.createConsumer).toHaveBeenCalledWith(
        kafkaConsumerGroups.paymentProcessors,
      );
      expect(mockConsumer.subscribe).toHaveBeenCalledWith({
        topics: ['cinema.payments'],
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

    it('should process PaymentConfirmed event and commit', async () => {
      const mockMessage = {
        value: Buffer.from(
          JSON.stringify({
            eventType: 'PaymentConfirmed',
            data: {
              paymentId: 'pay-123',
              reservationId: 'res-456',
              amount: 100,
              method: 'card',
              timestamp: new Date().toISOString(),
            },
            publishedAt: new Date().toISOString(),
          }),
        ),
        offset: '5',
      };

      const mockPayload = {
        topic: 'cinema.payments',
        partition: 1,
        message: mockMessage,
      };

      await eachMessageHandler(mockPayload);

      expect(mockConsumer.commitOffsets).toHaveBeenCalledWith([
        {
          topic: 'cinema.payments',
          partition: 1,
          offset: '6',
        },
      ]);
    });
  });
});
