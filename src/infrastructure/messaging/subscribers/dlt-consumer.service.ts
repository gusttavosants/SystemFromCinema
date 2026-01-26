/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Consumer, EachMessagePayload } from 'kafkajs';

import { KafkaClient } from '../kafka.client';
import { kafkaConsumerGroups } from '../kafka-topics.config';

@Injectable()
export class DltConsumerService implements OnModuleInit {
  private readonly logger = new Logger(DltConsumerService.name);
  private consumer: Consumer;

  constructor(private readonly kafkaClient: KafkaClient) {}

  async onModuleInit() {
    this.consumer = this.kafkaClient.createConsumer(
      kafkaConsumerGroups.dltProcessor,
    );

    try {
      await this.consumer.connect();
      await this.consumer.subscribe({
        topics: ['cinema.dead-letter'],
        fromBeginning: false,
      });

      await this.consumer.run({
        eachMessage: this.handleMessage.bind(this),
      });

      this.logger.log('DLT consumer started');
    } catch (error) {
      this.logger.error(
        `Failed to start DLT consumer: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      throw error;
    }
  }

  private async handleMessage(payload: EachMessagePayload): Promise<void> {
    const { topic, partition, message } = payload;

    try {
      const originalTopic = message.headers?.['x-original-topic']?.toString();
      const retryCount = parseInt(
        message.headers?.['x-retry-count']?.toString() || '0',
        10,
      );

      if (!originalTopic) {
        this.logger.error('No original topic found in DLT message headers');
        return;
      }

      if (retryCount >= 3) {
        this.logger.error(
          `Message from ${originalTopic} has exceeded max retries (${retryCount}), not re-publishing`,
        );
        return;
      }

      // Re-publish to original topic with incremented retry count
      const producer = this.kafkaClient.getProducer();
      await producer.send({
        topic: originalTopic,
        messages: [
          {
            key: message.key,
            value: message.value,
            headers: {
              ...message.headers,
              'x-retry-count': (retryCount + 1).toString(),
              'x-re-published-at': new Date().toISOString(),
            },
          },
        ],
      });

      this.logger.log(
        `Re-published message from DLT to ${originalTopic} (retry ${retryCount + 1})`,
      );

      // Commit offset for DLT message
      await this.consumer.commitOffsets([
        {
          topic,
          partition,
          offset: (BigInt(message.offset) + 1n).toString(),
        },
      ]);
    } catch (error) {
      this.logger.error(
        `Failed to process DLT message: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      // Do not commit offset to allow reprocessing
      throw error;
    }
  }
}
