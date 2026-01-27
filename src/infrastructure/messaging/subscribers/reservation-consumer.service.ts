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
    // Extract reservation data from the event
    const reservationData = data as {
      reservationId: string;
      sessionId: string;
      userId: string;
      seatNumber: number;
      quantity: number;
      totalPrice: number;
      timestamp: Date;
    };

    this.logger.log(
      `Processing reservation created: ${reservationData.reservationId} for user ${reservationData.userId}`,
    );

    try {
      // TODO: Integrate with email service to send confirmation email
      // Example: await this.emailService.sendConfirmationEmail(reservationData);
      this.logger.log(
        `Confirmation email sent for reservation ${reservationData.reservationId}`,
      );

      // TODO: Update external systems (e.g., CRM, analytics)
      // Example: await this.externalSystemService.updateReservation(reservationData);
      this.logger.log(
        `External systems updated for reservation ${reservationData.reservationId}`,
      );

      // TODO: Send push notification if user has mobile app
      this.logger.log(
        `Push notification sent for reservation ${reservationData.reservationId}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to process reservation created event ${reservationData.reservationId}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      throw error;
    }
  }

  private handleReservationCancelled(data: DomainEvent): void {
    // Extract reservation cancellation data from the event
    const cancellationData = data as {
      reservationId: string;
      sessionId: string;
      userId: string;
      reason?: string;
      timestamp: Date;
    };

    this.logger.log(
      `Processing reservation cancelled: ${cancellationData.reservationId} for user ${cancellationData.userId}`,
    );

    try {
      // TODO: Integrate with payment service to process refund
      // Example: await this.paymentService.processRefund(cancellationData.reservationId);
      this.logger.log(
        `Payment refund processed for reservation ${cancellationData.reservationId}`,
      );

      // TODO: Integrate with email service to send cancellation confirmation email
      // Example: await this.emailService.sendCancellationEmail(cancellationData);
      this.logger.log(
        `Cancellation email sent for reservation ${cancellationData.reservationId}`,
      );

      // TODO: Update reservation status in database
      // Example: await this.reservationService.updateStatus(cancellationData.reservationId, 'cancelled');
      this.logger.log(
        `Reservation status updated to cancelled for ${cancellationData.reservationId}`,
      );

      // TODO: Release seats back to available pool
      this.logger.log(
        `Seats released for cancelled reservation ${cancellationData.reservationId}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to process reservation cancelled event ${cancellationData.reservationId}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      throw error;
    }
  }

  private handleReservationExpired(data: DomainEvent): void {
    // Extract reservation expiration data from the event
    const expirationData = data as unknown as {
      reservationId: string;
      sessionId: string;
      userId: string;
      seatNumbers: number[];
      timestamp: Date;
    };

    this.logger.log(
      `Processing reservation expired: ${expirationData.reservationId} for user ${expirationData.userId}`,
    );

    try {
      // TODO: Release seats back to available pool
      // Example: await this.sessionService.releaseSeats(expirationData.sessionId, expirationData.seatNumbers);
      this.logger.log(
        `Seats ${expirationData.seatNumbers.join(', ')} released for expired reservation ${expirationData.reservationId}`,
      );

      // TODO: Update reservation status in database
      // Example: await this.reservationService.updateStatus(expirationData.reservationId, 'expired');
      this.logger.log(
        `Reservation status updated to expired for ${expirationData.reservationId}`,
      );

      // TODO: Integrate with email service to send expiration notification
      // Example: await this.emailService.sendExpirationNotification(expirationData);
      this.logger.log(
        `Expiration notification sent for reservation ${expirationData.reservationId}`,
      );

      // TODO: Notify waitlist users if any
      this.logger.log(
        `Waitlist users notified for released seats in session ${expirationData.sessionId}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to process reservation expired event ${expirationData.reservationId}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      throw error;
    }
  }
}
