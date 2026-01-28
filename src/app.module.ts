import { Module } from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { CacheModule } from '@nestjs/cache-manager';
import { ConfigModule } from '@nestjs/config';

import { AppController } from './app.controller';
import { AppService } from './app.service';

import { CinemaExceptionFilter } from '@shared/filters';
import { ResponseInterceptor } from '@shared/interceptors';

import {
  PaymentsController,
  ReservationsController,
  SessionsController,
  UsersController,
  AuthController,
} from './presentation/controllers';

import { RedisModule } from '@infrastructure/cache';
import { EventPublisherModule } from '@infrastructure/messaging';
import { EventsModule, EventsPublisherService } from '@infrastructure/events';
import { DatabaseModule } from '@infrastructure/database';
import { UserRepository } from '@infrastructure/database/repositories/user.repository';
import { JwtStrategy } from '@infrastructure/auth/jwt.strategy';
import { NotificationModule } from '@infrastructure/notifications/notification.module';
import { StructuredLoggerService } from '@infrastructure/logging';
import { ApplicationModule } from './application/application.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    CacheModule.register({
      isGlobal: true,
    }),
    DatabaseModule,
    RedisModule,
    EventPublisherModule,
    EventsModule,
    NotificationModule,
    ApplicationModule,
    PassportModule,
    JwtModule.register({
      secret:
        process.env.JWT_SECRET ||
        'your_super_secret_jwt_key_change_in_production',
      signOptions: {
        expiresIn: 86400,
      },
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
    JwtStrategy,
    UserRepository,
    EventsPublisherService,
    StructuredLoggerService,
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
