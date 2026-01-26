import { Module } from '@nestjs/common';
import { EventPublisherService } from './event-publisher.service';
import { KafkaClient } from './kafka.client';

@Module({
  providers: [KafkaClient, EventPublisherService],
  exports: [EventPublisherService],
})
export class EventPublisherModule {}
