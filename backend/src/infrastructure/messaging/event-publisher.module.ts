import { Module } from '@nestjs/common';
import { KafkaProducerService } from './event-publisher.service';
import { KafkaClient } from './kafka.client';
import { ReservationConsumerService } from './subscribers/reservation-consumer.service';
import { PaymentConsumerService } from './subscribers/payment-consumer.service';
import { NotificationConsumerService } from './subscribers/notification-consumer.service';
import { DltConsumerService } from './subscribers/dlt-consumer.service';

@Module({
  providers: [
    KafkaClient,
    KafkaProducerService,
    ReservationConsumerService,
    PaymentConsumerService,
    NotificationConsumerService,
    DltConsumerService,
  ],
  exports: [KafkaProducerService],
})
export class EventPublisherModule {}
