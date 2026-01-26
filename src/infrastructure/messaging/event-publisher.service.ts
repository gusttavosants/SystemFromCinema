import { Injectable, Logger } from '@nestjs/common';
import { Message } from 'kafkajs';
import { KafkaClient } from './kafka.client';
import { DomainEvent } from '@domain/events';

export interface EventPublishOptions {
  key?: string;
  timeout?: number;
}

@Injectable()
export class EventPublisherService {
  private readonly logger = new Logger(EventPublisherService.name);

  constructor(private readonly kafkaClient: KafkaClient) {}

  /**
   * Publica um evento no tópico correspondente
   * @param eventType Tipo do evento (ex: 'ReservationCreated')
   * @param data Dados do evento
   * @param options Opções de publicação
   */
  async publishEvent<T extends DomainEvent>(
    eventType: string,
    data: T,
    options?: EventPublishOptions,
  ): Promise<void> {
    const topic = this.getTopicForEventType(eventType);

    try {
      await this.publish(topic, [
        {
          key: options?.key || `${eventType}-${Date.now()}`,
          value: JSON.stringify({
            eventType,
            data,
            publishedAt: new Date().toISOString(),
          }),
        },
      ]);

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

  /**
   * Publica múltiplas mensagens em um tópico
   * @param topic Tópico Kafka
   * @param messages Mensagens a publicar
   * @param timeout Timeout em ms (default 30000)
   */
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

  /**
   * Mapeia tipo de evento para tópico Kafka
   */
  private getTopicForEventType(eventType: string): string {
    const topicMap: Record<string, string> = {
      ReservationCreated: 'events.reservations',
      ReservationCancelled: 'events.reservations',
      PaymentConfirmed: 'events.payments',
      PaymentFailed: 'events.payments',
      SessionCreated: 'events.sessions',
      SessionSoldOut: 'events.sessions',
    };

    return topicMap[eventType] || `events.${eventType.toLowerCase()}`;
  }
}
