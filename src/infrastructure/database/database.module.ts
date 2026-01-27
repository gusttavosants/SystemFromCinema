import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Session } from './entities/session.entity';
import { Seat } from './entities/seat.entity';
import { Reservation } from './entities/reservation.entity';
import { Sale } from './entities/sale.entity';
import { User } from './entities/user.entity';

import { SessionRepository } from './repositories/session.repository';
import { SeatRepository } from './repositories/seat.repository';
import { ReservationRepository } from './repositories/reservation.repository';
import { SaleRepository } from './repositories/sale.repository';
import { UserRepository } from './repositories/user.repository';

import { UnitOfWork } from './unit-of-work';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      username: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: process.env.DB_NAME || 'cinema_db',
      synchronize: process.env.NODE_ENV !== 'production',
      logging: process.env.NODE_ENV === 'development',
      entities: [Session, Seat, Reservation, Sale, User],
      migrations: ['src/infrastructure/database/migrations/*.ts'],
      subscribers: [],
    }),
    TypeOrmModule.forFeature([Session, Seat, Reservation, Sale, User]),
  ],
  providers: [
    SessionRepository,
    SeatRepository,
    ReservationRepository,
    SaleRepository,
    UserRepository,
    UnitOfWork,
  ],
  exports: [
    SessionRepository,
    SeatRepository,
    ReservationRepository,
    SaleRepository,
    UserRepository,
    UnitOfWork,
    TypeOrmModule,
  ],
})
export class DatabaseModule {}
