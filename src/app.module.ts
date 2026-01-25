import { Module } from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';

import { AppController } from './app.controller';
import { AppService } from './app.service';

import { HttpExceptionFilter } from '@shared/filters';
import { ResponseInterceptor } from '@shared/interceptors';

import {
  CreateSessionUseCase,
  ListAvailableSeatsUseCase,
  CreateReservationUseCase,
  ConfirmPaymentUseCase,
  CancelExpiredReservationsUseCase,
  GetUserPurchaseHistoryUseCase,
} from '@application/use-cases';

import {
  PaymentsController,
  ReservationsController,
  SessionsController,
  UsersController,
} from './presentation/controllers';

@Module({
  imports: [],
  controllers: [
    AppController,
    SessionsController,
    ReservationsController,
    PaymentsController,
    UsersController,
  ],
  providers: [
    AppService,
    // Use cases
    CreateSessionUseCase,
    ListAvailableSeatsUseCase,
    CreateReservationUseCase,
    ConfirmPaymentUseCase,
    CancelExpiredReservationsUseCase,
    GetUserPurchaseHistoryUseCase,
    // Global interceptors and filters
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseInterceptor,
    },
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
  ],
})
export class AppModule {}
