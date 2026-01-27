import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { KafkaModule } from '@infrastructure/messaging';
import { EventPublisherService } from '@infrastructure/messaging';
import { EventsPublisherService } from './services/events-publisher.service';
import { EventsSubscriberService } from './services/events-subscriber.service';
import { ReservationExpirationWorker } from './services/reservation-expiration.worker';
import { IdempotencyService } from './services/idempotency.service';
import { StructuredLoggerService } from '@infrastructure/logging';

@Module({
  imports: [KafkaModule, ScheduleModule.forRoot()],
  providers: [
    EventsPublisherService,
    EventsSubscriberService,
    ReservationExpirationWorker,
    IdempotencyService,
    StructuredLoggerService,
  ],
  exports: [EventsPublisherService],
})
export class EventsModule {}
