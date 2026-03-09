import { Sale } from '../entities/sale.entity';

export interface ISaleRepository {
  create(sale: Sale): Promise<void>;
  findById(id: string): Promise<Sale | null>;
  findByIdOrThrow(id: string): Promise<Sale>;
  findByReservationId(reservationId: string): Promise<Sale | null>;
  findByUserId(userId: string): Promise<Sale[]>;
  findBySessionId(sessionId: string): Promise<Sale[]>;
  findBySessionAndSeatNumber(
    sessionId: string,
    seatNumber: number,
  ): Promise<Sale | null>;
  update(sale: Sale): Promise<void>;
  delete(id: string): Promise<void>;
}
