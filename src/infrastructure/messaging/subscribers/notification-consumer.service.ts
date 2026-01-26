/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Consumer, EachMessagePayload } from 'kafkajs';

import { KafkaClient } from '../kafka.client';
import { kafkaConsumerGroups } from '../kafka-topics.config';
import { DomainEvent } from '@domain/events';

@Injectable()
export class NotificationConsumerService implements OnModuleInit {
  private readonly logger = new Logger(NotificationConsumerService.name);
  private consumer: Consumer;

  constructor(private readonly kafkaClient: KafkaClient) {}

  async onModuleInit() {
    this.consumer = this.kafkaClient.createConsumer(
      kafkaConsumerGroups.notificationSenders,
    );

    try {
      await this.consumer.connect();
      await this.consumer.subscribe({
        topics: ['cinema.notifications'],
        fromBeginning: false,
      });

      await this.consumer.run({
        eachMessage: this.handleMessage.bind(this),
      });

      this.logger.log('Notification consumer started');
    } catch (error) {
      this.logger.error(
        `Failed to start notification consumer: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      throw error;
    }
  }

  private async handleMessage(payload: EachMessagePayload): Promise<void> {
    const { topic, partition, message } = payload;

    if (!message.value) {
      this.logger.warn(`Received message with null value in topic ${topic}`);
      return;
    }

    try {
      const eventData: {
        eventType: string;
        data: DomainEvent;
        publishedAt: string;
      } = JSON.parse(message.value.toString());
      const eventType: string = eventData.eventType;
      const data: DomainEvent = eventData.data;

      this.logger.debug(`Processing event ${eventType} from topic ${topic}`);

      this.processEvent(eventType, data);

      // Manual offset commit
      await this.consumer.commitOffsets([
        {
          topic,
          partition,
          offset: (BigInt(message.offset) + 1n).toString(),
        },
      ]);

      this.logger.debug(`Event ${eventType} processed and offset committed`);
    } catch (error) {
      this.logger.error(
        `Failed to process message from topic ${topic}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );

      // Send to Dead Letter Topic
      try {
        const producer = this.kafkaClient.getProducer();
        await producer.send({
          topic: 'cinema.dead-letter',
          messages: [
            {
              key: message.key,
              value: message.value,
              headers: {
                'x-original-topic': topic,
                'x-error-message':
                  error instanceof Error ? error.message : String(error),
                'x-failed-at': new Date().toISOString(),
                'x-consumer-group': kafkaConsumerGroups.notificationSenders,
              },
            },
          ],
        });
        this.logger.warn(`Message sent to Dead Letter Topic from ${topic}`);
      } catch (dltError) {
        this.logger.error(
          `Failed to send message to Dead Letter Topic: ${
            dltError instanceof Error ? dltError.message : String(dltError)
          }`,
        );
      }

      throw error;
    }
  }

  private processEvent(eventType: string, data: DomainEvent): void {
    switch (eventType) {
      case 'SessionCreated':
        this.handleSessionCreated(data);
        break;
      case 'SessionSoldOut':
        this.handleSessionSoldOut(data);
        break;
      default:
        this.logger.warn(`Unknown event type: ${eventType}`);
    }
  }

  private handleSessionCreated(data: DomainEvent): void {
    void data;
    // TODO: Implement logic to handle session created
    // e.g., send notifications to subscribers
    this.logger.log('Handling SessionCreated event');
  }

  private handleSessionSoldOut(_data: DomainEvent): void {
    void _data;
    // TODO: Implement logic to handle session sold out
    // e.g., notify waitlist users
    this.logger.log('Handling SessionSoldOut event');
  }
}
