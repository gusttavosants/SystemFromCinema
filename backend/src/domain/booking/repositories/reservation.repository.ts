import { Reservation } from '../entities/reservation.entity';

export interface IReservationRepository {
  create(reservation: Reservation): Promise<void>;
  findById(id: string): Promise<Reservation | null>;
  findByIdOrThrow(id: string): Promise<Reservation>;
  findBySessionId(sessionId: string): Promise<Reservation[]>;
  findByUserId(userId: string): Promise<Reservation[]>;
  findPendingBySessionAndSeats(
    sessionId: string,
    seatNumbers: number[],
  ): Promise<Reservation[]>;
  findExpiredReservations(): Promise<Reservation[]>;
  findPendingReservationsBySession(sessionId: string): Promise<Reservation[]>;
  update(reservation: Reservation): Promise<void>;
  delete(id: string): Promise<void>;
}
