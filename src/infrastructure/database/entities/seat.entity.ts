import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  VersionColumn,
} from 'typeorm';

import { Session } from './session.entity';
import { Reservation } from './reservation.entity';
import { Sale } from './sale.entity';

@Entity('seats')
@Index(['sessionId', 'seatNumber'], { unique: true })
@Index(['sessionId', 'status'])
export class Seat {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: false })
  sessionId: string;

  @Column({ type: 'int', nullable: false })
  seatNumber: number;

  @Column({
    type: 'enum',
    enum: ['available', 'reserved', 'sold'],
    default: 'available',
  })
  status: 'available' | 'reserved' | 'sold';

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @VersionColumn()
  version: number;

  @ManyToOne(() => Session, (session) => session.seats, {
    onDelete: 'CASCADE',
  })
  session: Session;

  @OneToMany(() => Reservation, (reservation) => reservation.seat)
  reservations: Reservation[];

  @OneToMany(() => Sale, (sale) => sale.seat)
  sales: Sale[];
}
