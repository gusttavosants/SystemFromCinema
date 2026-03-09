import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  VersionColumn,
} from 'typeorm';

import { Seat } from './seat.entity';
import { Reservation } from './reservation.entity';
import { Sale } from './sale.entity';

@Entity('sessions')
@Index(['movieTitle', 'showTime'])
@Index(['showTime'])
@Index(['room'])
export class Session {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255, nullable: false })
  movieTitle: string;

  @Column({ type: 'datetime', nullable: false })
  showTime: Date;

  @Column({ type: 'varchar', length: 100, nullable: false })
  room: string;

  @Column({ type: 'int', nullable: false })
  totalSeats: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: false })
  price: number;

  @Column({ type: 'text', nullable: true })
  description: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @VersionColumn()
  version: number;

  @OneToMany(() => Seat, (seat) => seat.session, { cascade: true })
  seats: Seat[];

  @OneToMany(() => Reservation, (reservation) => reservation.session)
  reservations: Reservation[];

  @OneToMany(() => Sale, (sale) => sale.session)
  sales: Sale[];
}
