import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { LoginUserUseCase, RegisterUserUseCase } from './use-cases/auth';
import {
  CancelExpiredReservationsUseCase,
  ConfirmPaymentUseCase,
  CreateReservationUseCase,
} from './use-cases/booking';
import {
  CreateSessionUseCase,
  GetSessionAvailabilityUseCase,
  ListAvailableSeatsUseCase,
} from './use-cases/session';
import { GetUserPurchaseHistoryUseCase } from './use-cases/user';
import { DatabaseModule } from '@infrastructure/database';
import { RedisModule } from '@infrastructure/cache';
import { EventsModule } from '@infrastructure/events';
import { NotificationModule } from '@infrastructure/notifications/notification.module';
import { ReservationExpirationWorker } from '@infrastructure/events/services/reservation-expiration.worker';

const useCases = [
  LoginUserUseCase,
  RegisterUserUseCase,
  CancelExpiredReservationsUseCase,
  ConfirmPaymentUseCase,
  CreateReservationUseCase,
  CreateSessionUseCase,
  GetSessionAvailabilityUseCase,
  ListAvailableSeatsUseCase,
  GetUserPurchaseHistoryUseCase,
];

@Module({
  imports: [
    DatabaseModule,
    RedisModule,
    EventsModule,
    NotificationModule,
    JwtModule.register({
      secret:
        process.env.JWT_SECRET ||
        'your_super_secret_jwt_key_change_in_production',
      signOptions: {
        expiresIn: 86400,
      },
    }),
  ],
  providers: [...useCases, ReservationExpirationWorker],
  exports: [...useCases, ReservationExpirationWorker],
})
export class ApplicationModule {}
