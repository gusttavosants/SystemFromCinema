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
    // Extract session created data from the event
    const sessionData = data as {
      sessionId: string;
      movieId: string;
      startTime: Date;
      availableSeats: number;
      timestamp: Date;
    };

    this.logger.log(
      `Processing session created: ${sessionData.sessionId} for movie ${sessionData.movieId}`,
    );

    try {
      // TODO: Get list of subscribers for this movie/session
      // Example: const subscribers = await this.notificationService.getSubscribers(sessionData.movieId);
      this.logger.log(
        `Retrieved subscribers for session ${sessionData.sessionId}`,
      );

      // TODO: Send notifications to all subscribers
      // Example: await this.notificationService.sendBulkNotifications(subscribers, sessionData);
      this.logger.log(
        `Bulk notifications sent to subscribers for session ${sessionData.sessionId}`,
      );

      // TODO: Send push notifications to mobile app users
      // Example: await this.pushNotificationService.sendSessionAvailable(sessionData);
      this.logger.log(
        `Push notifications sent for new session ${sessionData.sessionId}`,
      );

      // TODO: Update notification preferences in database
      this.logger.log(
        `Notification preferences updated for session ${sessionData.sessionId}`,
      );

      // TODO: Send promotional emails if configured
      this.logger.log(
        `Promotional emails sent for new session ${sessionData.sessionId}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to process session created event ${sessionData.sessionId}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      throw error;
    }
  }

  private handleSessionSoldOut(data: DomainEvent): void {
    // Extract session sold out data from the event
    const soldOutData = data as {
      sessionId: string;
      movieId: string;
      totalSeats: number;
      timestamp: Date;
    };

    this.logger.log(
      `Processing session sold out: ${soldOutData.sessionId} for movie ${soldOutData.movieId}`,
    );

    try {
      // TODO: Get waitlist users for this session
      // Example: const waitlistUsers = await this.waitlistService.getWaitlistUsers(soldOutData.sessionId);
      this.logger.log(
        `Retrieved ${0} waitlist users for sold out session ${soldOutData.sessionId}`,
      );

      // TODO: Send notifications to waitlist users
      // Example: await this.notificationService.notifyWaitlistUsers(waitlistUsers, soldOutData);
      this.logger.log(
        `Waitlist notifications sent for sold out session ${soldOutData.sessionId}`,
      );

      // TODO: Send push notifications to mobile app waitlist users
      // Example: await this.pushNotificationService.notifyWaitlist(soldOutData);
      this.logger.log(
        `Push notifications sent to waitlist for sold out session ${soldOutData.sessionId}`,
      );

      // TODO: Send email notifications to waitlist users
      // Example: await this.emailService.sendWaitlistNotifications(waitlistUsers, soldOutData);
      this.logger.log(
        `Email notifications sent to waitlist for sold out session ${soldOutData.sessionId}`,
      );

      // TODO: Update waitlist status and notify about alternatives
      this.logger.log(
        `Waitlist status updated and alternative sessions suggested for session ${soldOutData.sessionId}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to process session sold out event ${soldOutData.sessionId}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      throw error;
    }
  }
}
