import { Injectable, Logger } from '@nestjs/common';
import { CompressionTypes, type Message } from 'kafkajs';
import { KafkaClient } from './kafka.client';
import { DomainEvent } from '@domain/events';

export interface EventPublishOptions {
  key?: string;
  timeout?: number;
  headers?: Message['headers'];
  partitionKey?: string;
}

@Injectable()
export class KafkaProducerService {
  private readonly logger = new Logger(KafkaProducerService.name);

  constructor(private readonly kafkaClient: KafkaClient) {}

  async publishEvent<T extends DomainEvent>(
    eventType: string,
    data: T,
    options?: EventPublishOptions,
  ): Promise<void> {
    const topic = this.getTopicForEventType(eventType);
    const key = options?.key || this.resolvePartitionKey(eventType, data);

    try {
      await this.publish(
        topic,
        [
          {
            key,
            value: JSON.stringify({
              eventType,
              data,
              publishedAt: new Date().toISOString(),
            }),
            headers: {
              'x-event-type': Buffer.from(eventType),
              ...(options?.headers ?? {}),
            },
          },
        ],
        options?.timeout,
      );

      this.logger.debug(`Event ${eventType} published to topic ${topic}`);
    } catch (error) {
      this.logger.error(
        `Failed to publish event ${eventType}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      throw error;
    }
  }

  async publish(
    topic: string,
    messages: Message[],
    timeout?: number,
  ): Promise<void> {
    const producer = this.kafkaClient.getProducer();

    try {
      await producer.send({
        topic,
        messages,
        timeout: timeout || 30000,
        compression: CompressionTypes.GZIP,
      });
    } catch (error) {
      this.logger.error(
        `Failed to publish to topic ${topic}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      throw error;
    }
  }

  async publishBatch(
    topic: string,
    events: Array<{
      eventType: string;
      data: DomainEvent;
      options?: EventPublishOptions;
    }>,
  ): Promise<void> {
    const messages: Message[] = events.map(({ eventType, data, options }) => ({
      key: options?.key || this.resolvePartitionKey(eventType, data),
      value: JSON.stringify({
        eventType,
        data,
        publishedAt: new Date().toISOString(),
      }),
      headers: {
        'x-event-type': Buffer.from(eventType),
        ...(options?.headers ?? {}),
      },
    }));

    await this.publish(topic, messages, events[0]?.options?.timeout);
  }

  private getTopicForEventType(eventType: string): string {
    const topicMap: Record<string, string> = {
      ReservationCreated: 'cinema.reservations',
      ReservationCancelled: 'cinema.reservations',
      ReservationExpired: 'cinema.reservations',
      PaymentConfirmed: 'cinema.payments',
      PaymentFailed: 'cinema.payments',
      SessionCreated: 'cinema.notifications',
      SessionSoldOut: 'cinema.notifications',
    };

    return topicMap[eventType] || `cinema.${eventType.toLowerCase()}`;
  }

  private resolvePartitionKey(eventType: string, data: DomainEvent): string {
    const candidate =
      (data as unknown as Record<string, unknown>).sessionId ??
      (data as unknown as Record<string, unknown>).reservationId ??
      (data as unknown as Record<string, unknown>).userId ??
      eventType;

    if (typeof candidate === 'string' || typeof candidate === 'number') {
      return String(candidate);
    }

    return eventType;
  }
}

export { KafkaProducerService as EventPublisherService };
