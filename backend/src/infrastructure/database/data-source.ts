import { DataSource } from 'typeorm';

import { Session } from './entities/session.entity';
import { Seat } from './entities/seat.entity';
import { Reservation } from './entities/reservation.entity';
import { Sale } from './entities/sale.entity';
import { User } from '@domain/user/entities/user.entity';

export const AppDataSource = new DataSource({
  type: 'better-sqlite3',
  database: process.env.DB_PATH || './cinema.db',
  synchronize: true,
  logging: process.env.NODE_ENV === 'development',
  entities: [Session, Seat, Reservation, Sale, User],
  migrations: [],
  subscribers: [],
});
