import { Module } from '@nestjs/common';
import { EventPublisherModule, KafkaModule } from '@infrastructure/messaging';
import { RedisModule } from '@infrastructure/cache';
import { EventsPublisherService } from './services/events-publisher.service';
import { EventsSubscriberService } from './services/events-subscriber.service';
import { IdempotencyService } from './services/idempotency.service';
import { StructuredLoggerService } from '@infrastructure/logging';

@Module({
  imports: [EventPublisherModule, KafkaModule, RedisModule],
  providers: [
    EventsPublisherService,
    EventsSubscriberService,
    IdempotencyService,
    StructuredLoggerService,
  ],
  exports: [EventsPublisherService],
})
export class EventsModule {}
