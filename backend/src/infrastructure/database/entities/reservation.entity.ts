import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  VersionColumn,
} from 'typeorm';

import { Session } from './session.entity';
import { Seat } from './seat.entity';

@Entity('reservations')
@Index(['sessionId', 'userId'])
@Index(['sessionId', 'status'])
@Index(['userId', 'status'])
@Index(['expiresAt'])
export class Reservation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: false })
  sessionId: string;

  @Column({ type: 'uuid', nullable: false })
  seatId: string;

  @Column({ type: 'uuid', nullable: false })
  userId: string;

  @Column({ type: 'int', nullable: false })
  seatNumber: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: false })
  totalPrice: number;

  @Column({
    type: 'enum',
    enum: ['pending', 'confirmed', 'expired', 'cancelled'],
    default: 'pending',
  })
  status: 'pending' | 'confirmed' | 'expired' | 'cancelled';

  @Column({ type: 'timestamp', nullable: false })
  expiresAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @VersionColumn()
  version: number;

  @ManyToOne(() => Session, (session) => session.reservations, {
    onDelete: 'CASCADE',
  })
  session: Session;

  @ManyToOne(() => Seat, (seat) => seat.reservations, {
    onDelete: 'CASCADE',
  })
  seat: Seat;
}
