import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { DatabaseModule } from '@infrastructure/database';
import { EventsModule } from '@infrastructure/events';
import { ReservationExpirationWorker } from '@infrastructure/events/services/reservation-expiration.worker';
import { ApplicationModule } from '../../application/application.module';
import { forwardRef } from '@nestjs/common';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    DatabaseModule,
    EventsModule,
    forwardRef(() => ApplicationModule),
  ],
  providers: [ReservationExpirationWorker],
  exports: [ReservationExpirationWorker],
})
export class WorkersModule {}
