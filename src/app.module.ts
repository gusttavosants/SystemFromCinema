import { Module } from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

import { AppController } from './app.controller';
import { AppService } from './app.service';

import { CinemaExceptionFilter } from '@shared/filters';
import { ResponseInterceptor } from '@shared/interceptors';

import {
  CreateSessionUseCase,
  ListAvailableSeatsUseCase,
  CreateReservationUseCase,
  ConfirmPaymentUseCase,
  CancelExpiredReservationsUseCase,
  GetUserPurchaseHistoryUseCase,
  GetSessionAvailabilityUseCase,
  RegisterUserUseCase,
  LoginUserUseCase,
} from '@application/use-cases';

import {
  PaymentsController,
  ReservationsController,
  SessionsController,
  UsersController,
  AuthController,
} from './presentation/controllers';

import { RedisModule, DistributedLockService } from '@infrastructure/cache';
import { EventPublisherModule } from '@infrastructure/messaging';
import { EventsModule } from '@infrastructure/events';
import { DatabaseModule } from '@infrastructure/database';
import { UserRepository } from '@infrastructure/database/repositories/user.repository';
import { JwtStrategy } from '@infrastructure/auth/jwt.strategy';
import { NotificationModule } from '@infrastructure/notifications/notification.module';
import { CacheService } from '@infrastructure/cache/cache.service';

@Module({
  imports: [
    DatabaseModule,
    RedisModule,
    EventPublisherModule,
    EventsModule,
    NotificationModule,
    PassportModule,
    JwtModule.register({
      secret:
        process.env.JWT_SECRET ||
        'your_super_secret_jwt_key_change_in_production',
      signOptions: { expiresIn: process.env.JWT_EXPIRATION || '24h' },
    }),
  ],
  controllers: [
    AppController,
    SessionsController,
    ReservationsController,
    PaymentsController,
    UsersController,
    AuthController,
  ],

  providers: [
    AppService,
    // Authentication
    JwtStrategy,
    UserRepository,
    // Cache & Locking
    CacheService,
    DistributedLockService,
    // Use cases
    CreateSessionUseCase,
    ListAvailableSeatsUseCase,
    GetSessionAvailabilityUseCase,
    CreateReservationUseCase,
    ConfirmPaymentUseCase,
    CancelExpiredReservationsUseCase,
    GetUserPurchaseHistoryUseCase,
    RegisterUserUseCase,
    LoginUserUseCase,
    // Global interceptors and filters
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseInterceptor,
    },
    {
      provide: APP_FILTER,
      useClass: CinemaExceptionFilter,
    },
  ],
})
export class AppModule {}
