import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { KafkaClient } from '@infrastructure/messaging';
import { EventsPublisherService } from './events-publisher.service';
import { IdempotencyService } from './idempotency.service';

interface KafkaMessage {
  value?: Buffer | null;
}

interface EventData {
  eventId?: string;
  eventType: string;
  data: any;
}

interface ReservationData {
  reservationId: string;
  sessionId: string;
  seatNumbers?: number[];
  reason?: string;
}

interface SeatData {
  sessionId: string;
  seatNumber: number;
  reason: string;
}

interface PaymentData {
  reservationId: string;
}

@Injectable()
export class EventsSubscriberService implements OnModuleInit {
  private readonly logger = new Logger(EventsSubscriberService.name);

  constructor(
    private readonly kafkaClient: KafkaClient,
    private readonly eventsPublisher: EventsPublisherService,
    private readonly idempotencyService: IdempotencyService,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.setupConsumers();
  }

  private async setupConsumers(): Promise<void> {
    try {
      // Consumer para eventos de expiração de reservas
      const reservationConsumer = this.kafkaClient.createConsumer(
        'events-reservations-group',
      );
      await reservationConsumer.connect();

      await reservationConsumer.subscribe({
        topic: 'cinema.reservations',
        fromBeginning: false,
      });

      await reservationConsumer.run({
        eachMessage: async ({ topic, partition, message }) => {
          void topic;

          void partition;

          try {
            await this.handleReservationEvent(message);
          } catch (error) {
            this.logger.error(
              `Error processing reservation event: ${error instanceof Error ? error.message : String(error)}`,
            );
          }
        },
      });

      // Consumer para eventos de pagamento
      const paymentConsumer = this.kafkaClient.createConsumer(
        'events-payments-group',
      );
      await paymentConsumer.connect();

      await paymentConsumer.subscribe({
        topic: 'cinema.payments',
        fromBeginning: false,
      });

      await paymentConsumer.run({
        eachMessage: async ({ topic, partition, message }) => {
          void topic;

          void partition;

          try {
            await this.handlePaymentEvent(message);
          } catch (error) {
            this.logger.error(
              `Error processing payment event: ${error instanceof Error ? error.message : String(error)}`,
            );
          }
        },
      });

      this.logger.log('Events consumers configured successfully');
    } catch (error) {
      this.logger.error(
        `Failed to setup events consumers: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }

  private async handleReservationEvent(message: KafkaMessage): Promise<void> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const event: EventData = JSON.parse(message.value?.toString() || '{}');
      this.logger.debug(`Processing reservation event: ${event.eventType}`);

      const eventId =
        event.eventId || `reservation-${event.eventType}-${Date.now()}`;

      const { processed } =
        await this.idempotencyService.processEventIdempotently(
          eventId,
          async () => {
            switch (event.eventType) {
              case 'reservation.created':
                await this.handleReservationCreated(
                  event.data as ReservationData,
                );
                break;
              case 'reservation.expired':
                await this.handleReservationExpired(
                  event.data as ReservationData,
                );
                break;
              case 'seat.released':
                await this.handleSeatReleased(event.data as SeatData);
                break;
              default:
                this.logger.warn(
                  `Unknown reservation event type: ${event.eventType}`,
                );
            }
          },
        );

      if (!processed) {
        this.logger.debug(`Reservation event ${eventId} was already processed`);
      }
    } catch (error) {
      this.logger.error(
        `Error parsing reservation event: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      throw error;
    }
  }

  private async handlePaymentEvent(message: KafkaMessage): Promise<void> {
    try {
      const rawMessage = message.value?.toString() || '{}';
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const event: EventData = JSON.parse(rawMessage);
      this.logger.debug(`Processing payment event: ${event.eventType}`);

      const eventId =
        event.eventId || `payment-${event.eventType}-${Date.now()}`;

      const { processed } =
        await this.idempotencyService.processEventIdempotently(
          eventId,
          async () => {
            switch (event.eventType) {
              case 'payment.confirmed':
                await this.handlePaymentConfirmed(event.data as PaymentData);
                break;
              default:
                this.logger.warn(
                  `Unknown payment event type: ${event.eventType}`,
                );
            }
          },
        );

      if (!processed) {
        this.logger.debug(`Payment event ${eventId} was already processed`);
      }
    } catch (error) {
      this.logger.error(
        `Error parsing payment event: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      throw error;
    }
  }

  private async handleReservationCreated(data: ReservationData): Promise<void> {
    this.logger.log(
      `Reservation created: ${data.reservationId} for session ${data.sessionId}`,
    );
    // TODO: Implementar lógica adicional se necessário
    await Promise.resolve(); // Ensure async method has await
  }

  private async handleReservationExpired(data: ReservationData): Promise<void> {
    this.logger.log(
      `Reservation expired: ${data.reservationId}, releasing seats: ${data.seatNumbers?.join(', ')}`,
    );

    // Publicar eventos para liberar cada assento
    for (const seatNumber of data.seatNumbers || []) {
      await this.eventsPublisher.publishSeatReleased({
        sessionId: data.sessionId,
        seatNumber,
        releasedAt: new Date(),
        reason: (data.reason as 'expired' | 'cancelled') || 'expired',
      });
    }
  }

  private async handleSeatReleased(data: SeatData): Promise<void> {
    this.logger.log(
      `Seat ${data.seatNumber} in session ${data.sessionId} released due to ${data.reason}`,
    );
    // TODO: Implementar atualização do status do assento no banco
    await Promise.resolve(); // Ensure async method has await
  }

  private async handlePaymentConfirmed(data: PaymentData): Promise<void> {
    this.logger.log(`Payment confirmed for reservation ${data.reservationId}`);
    // TODO: Implementar lógica adicional se necessário
    await Promise.resolve(); // Ensure async method has await
  }
}
