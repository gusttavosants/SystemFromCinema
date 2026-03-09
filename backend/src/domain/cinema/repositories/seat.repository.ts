import { Seat, type SeatStatus } from '../entities/seat.entity';

export interface ISeatRepository {
  create(seat: Seat): Promise<void>;
  findById(id: string): Promise<Seat | null>;
  findBySessionAndNumber(
    sessionId: string,
    seatNumber: number,
  ): Promise<Seat | null>;
  findBySessionId(sessionId: string): Promise<Seat[]>;
  findAvailableSeatsBySession(sessionId: string): Promise<Seat[]>;
  findBySessionAndNumbers(
    sessionId: string,
    seatNumbers: number[],
  ): Promise<Seat[]>;
  findWithPessimisticLock(
    sessionId: string,
    seatNumbers: number[],
  ): Promise<Seat[]>;
  update(seat: Seat): Promise<void>;
  updateStatus(seatId: string, status: SeatStatus): Promise<void>;
}
