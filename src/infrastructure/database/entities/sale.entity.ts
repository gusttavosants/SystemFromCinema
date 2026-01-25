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

@Entity('sales')
@Index(['sessionId', 'userId'])
@Index(['userId', 'confirmedAt'])
@Index(['sessionId', 'confirmedAt'])
export class Sale {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: true })
  reservationId: string;

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

  @Column({ type: 'varchar', length: 100, nullable: true })
  paymentMethod: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  paymentTransactionId: string;

  @Column({
    type: 'enum',
    enum: ['pending', 'confirmed', 'refunded'],
    default: 'pending',
  })
  status: 'pending' | 'confirmed' | 'refunded';

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  confirmedAt: Date;

  @VersionColumn()
  version: number;

  @ManyToOne(() => Session, (session) => session.sales, {
    onDelete: 'CASCADE',
  })
  session: Session;

  @ManyToOne(() => Seat, (seat) => seat.sales, {
    onDelete: 'CASCADE',
  })
  seat: Seat;
}
