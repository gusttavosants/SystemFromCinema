import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Session } from './entities/session.entity';
import { Seat } from './entities/seat.entity';
import { Reservation } from './entities/reservation.entity';
import { Sale } from './entities/sale.entity';
import { User } from '@domain/user/entities/user.entity';

import { SessionRepositoryImpl } from './repositories/session.repository.impl';
import { SeatRepositoryImpl } from './repositories/seat.repository.impl';
import { ReservationRepositoryImpl } from './repositories/reservation.repository.impl';
import { SaleRepositoryImpl } from './repositories/sale.repository.impl';
import { UserRepository } from './repositories/user.repository';

import { UnitOfWork } from './unit-of-work';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'better-sqlite3',
      database: process.env.DB_PATH || './cinema.db',
      synchronize: true,
      logging: process.env.NODE_ENV === 'development',
      entities: [Session, Seat, Reservation, Sale, User],
      migrations: [],
      subscribers: [],
    }),
    TypeOrmModule.forFeature([Session, Seat, Reservation, Sale, User]),
  ],
  providers: [
    {
      provide: 'ISessionRepository',
      useClass: SessionRepositoryImpl,
    },
    {
      provide: 'ISeatRepository',
      useClass: SeatRepositoryImpl,
    },
    {
      provide: 'IReservationRepository',
      useClass: ReservationRepositoryImpl,
    },
    {
      provide: 'ISaleRepository',
      useClass: SaleRepositoryImpl,
    },
    {
      provide: 'IUserRepository',
      useClass: UserRepository,
    },
    UnitOfWork,
  ],
  exports: [
    'ISessionRepository',
    'ISeatRepository',
    'IReservationRepository',
    'ISaleRepository',
    'IUserRepository',
    UnitOfWork,
    TypeOrmModule,
  ],
})
export class DatabaseModule {}
