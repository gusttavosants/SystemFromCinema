import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { KafkaModule } from '@infrastructure/messaging';
import {
  EventsPublisherService,
  EventsSubscriberService,
  IdempotencyService,
} from './index';
import { ReservationExpirationWorker } from './services/reservation-expiration.worker';
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
