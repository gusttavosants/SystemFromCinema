/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Consumer, EachMessagePayload } from 'kafkajs';

import { KafkaClient } from '../kafka.client';
import { kafkaConsumerGroups } from '../kafka-topics.config';
import { DomainEvent } from '@domain/events';

@Injectable()
export class ReservationConsumerService implements OnModuleInit {
  private readonly logger = new Logger(ReservationConsumerService.name);
  private consumer: Consumer;

  constructor(private readonly kafkaClient: KafkaClient) {}

  async onModuleInit() {
    this.consumer = this.kafkaClient.createConsumer(
      kafkaConsumerGroups.reservationProcessors,
    );

    try {
      await this.consumer.connect();
      await this.consumer.subscribe({
        topics: ['cinema.reservations'],
        fromBeginning: false,
      });

      await this.consumer.run({
        eachMessage: this.handleMessage.bind(this),
      });

      this.logger.log('Reservation consumer started');
    } catch (error) {
      this.logger.error(
        `Failed to start reservation consumer: ${
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
                'x-consumer-group': kafkaConsumerGroups.reservationProcessors,
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
      case 'ReservationCreated':
        this.handleReservationCreated(data);
        break;
      case 'ReservationCancelled':
        this.handleReservationCancelled(data);
        break;
      case 'ReservationExpired':
        this.handleReservationExpired(data);
        break;
      default:
        this.logger.warn(`Unknown event type: ${eventType}`);
    }
  }

  private handleReservationCreated(data: DomainEvent): void {
    void data;
    // TODO: Implement logic to handle reservation created event
    // e.g., send confirmation email, update external systems
    this.logger.log('Handling ReservationCreated event');
  }

  private handleReservationCancelled(data: DomainEvent): void {
    void data;
    // TODO: Implement logic to handle reservation cancelled event
    // e.g., refund payment, send cancellation email
    this.logger.log('Handling ReservationCancelled event');
  }

  private handleReservationExpired(data: DomainEvent): void {
    void data;
    // TODO: Implement logic to handle reservation expired event
    // e.g., release seats, send expiration notification
    this.logger.log('Handling ReservationExpired event');
  }
}
