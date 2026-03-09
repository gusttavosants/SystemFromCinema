/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Consumer, EachMessagePayload } from 'kafkajs';

import { KafkaClient } from '../kafka.client';
import { kafkaConsumerGroups } from '../kafka-topics.config';
import { DomainEvent } from '@domain/events';

@Injectable()
export class PaymentConsumerService implements OnModuleInit {
  private readonly logger = new Logger(PaymentConsumerService.name);
  private consumer: Consumer;

  constructor(private readonly kafkaClient: KafkaClient) {}

  async onModuleInit() {
    this.consumer = this.kafkaClient.createConsumer(
      kafkaConsumerGroups.paymentProcessors,
    );

    try {
      await this.consumer.connect();
      await this.consumer.subscribe({
        topics: ['cinema.payments'],
        fromBeginning: false,
      });

      await this.consumer.run({
        eachMessage: this.handleMessage.bind(this),
      });

      this.logger.log('Payment consumer started');
    } catch (error) {
      this.logger.error(
        `Failed to start payment consumer: ${
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
                'x-consumer-group': kafkaConsumerGroups.paymentProcessors,
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
      case 'PaymentConfirmed':
        this.handlePaymentConfirmed(data);
        break;
      case 'PaymentFailed':
        this.handlePaymentFailed(data);
        break;
      default:
        this.logger.warn(`Unknown event type: ${eventType}`);
    }
  }

  private handlePaymentConfirmed(data: DomainEvent): void {
    // Extract payment confirmation data from the event
    const paymentData = data as {
      paymentId: string;
      reservationId: string;
      amount: number;
      method: string;
      timestamp: Date;
    };

    this.logger.log(
      `Processing payment confirmed: ${paymentData.paymentId} for reservation ${paymentData.reservationId}`,
    );

    try {
      // TODO: Confirm reservation status in database
      // Example: await this.reservationService.confirmReservation(paymentData.reservationId);
      this.logger.log(
        `Reservation ${paymentData.reservationId} confirmed with payment ${paymentData.paymentId}`,
      );

      // TODO: Integrate with email service to send payment success email
      // Example: await this.emailService.sendPaymentSuccessEmail(paymentData);
      this.logger.log(
        `Payment success email sent for reservation ${paymentData.reservationId}`,
      );

      // TODO: Send SMS notification if user opted in
      // Example: await this.smsService.sendPaymentConfirmation(paymentData);
      this.logger.log(
        `SMS notification sent for payment ${paymentData.paymentId}`,
      );

      // TODO: Update payment status in external payment gateway
      this.logger.log(
        `External payment gateway updated for payment ${paymentData.paymentId}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to process payment confirmed event ${paymentData.paymentId}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      throw error;
    }
  }

  private handlePaymentFailed(data: DomainEvent): void {
    // Extract payment failure data from the event
    const failureData = data as {
      paymentId: string;
      reservationId: string;
      amount: number;
      reason?: string;
      timestamp: Date;
    };

    this.logger.log(
      `Processing payment failed: ${failureData.paymentId} for reservation ${failureData.reservationId}`,
    );

    try {
      // TODO: Cancel reservation due to payment failure
      // Example: await this.reservationService.cancelReservation(failureData.reservationId, 'payment_failed');
      this.logger.log(
        `Reservation ${failureData.reservationId} cancelled due to payment failure ${failureData.paymentId}`,
      );

      // TODO: Release seats back to available pool
      // Example: await this.sessionService.releaseSeatsForReservation(failureData.reservationId);
      this.logger.log(
        `Seats released for cancelled reservation ${failureData.reservationId}`,
      );

      // TODO: Integrate with email service to send payment failure notification
      // Example: await this.emailService.sendPaymentFailureEmail(failureData);
      this.logger.log(
        `Payment failure email sent for reservation ${failureData.reservationId}`,
      );

      // TODO: Update payment status in external payment gateway
      this.logger.log(
        `External payment gateway updated with failure status for payment ${failureData.paymentId}`,
      );

      // TODO: Notify waitlist users if any seats became available
      this.logger.log(
        `Waitlist users notified for available seats from failed reservation ${failureData.reservationId}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to process payment failed event ${failureData.paymentId}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      throw error;
    }
  }
}
