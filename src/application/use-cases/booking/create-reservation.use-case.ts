import { Injectable } from '@nestjs/common';

import {
  CreateReservationRequestDTO,
  ReservationResponseDTO,
} from '@application/dtos';
import { Reservation } from '@domain/booking/entities/reservation.entity';
import type { IReservationRepository } from '@domain/booking/repositories/reservation.repository';
import type { ISeatRepository } from '@domain/cinema/repositories/seat.repository';
import type { ISessionRepository } from '@domain/cinema/repositories/session.repository';
import { UnitOfWork } from '@infrastructure/database/unit-of-work';

@Injectable()
export class CreateReservationUseCase {
  constructor(
    private readonly unitOfWork: UnitOfWork,
    private readonly sessionRepository: ISessionRepository,
    private readonly seatRepository: ISeatRepository,
    private readonly reservationRepository: IReservationRepository,
  ) {}

  async execute(
    input: CreateReservationRequestDTO,
  ): Promise<ReservationResponseDTO> {
    const session = await this.sessionRepository.findById(input.sessionId);

    if (!session) {
      throw new Error(`Session with id ${input.sessionId} not found`);
    }

    let reservation: Reservation;

    await this.unitOfWork.transactionPessimistic(async () => {
      // Lock pessimista para evitar race condition
      const seatsWithLock = await this.seatRepository.findWithPessimisticLock(
        input.sessionId,
        input.seatNumbers,
      );

      // Validar que todos os assentos estão disponíveis
      const unavailableSeats = seatsWithLock.filter(
        (s) => s.status !== 'available',
      );
      if (unavailableSeats.length > 0) {
        throw new Error(
          `Seats ${unavailableSeats.map((s) => s.seatNumber.getValue()).join(', ')} are not available`,
        );
      }

      // Criar reserva
      const totalPrice = session.getPrice().multiply(input.seatNumbers.length);
      reservation = Reservation.create({
        sessionId: input.sessionId,
        userId: input.userId,
        seatNumbers: input.seatNumbers,
        totalPrice,
      });

      // Salvar reserva
      await this.reservationRepository.create(reservation);

      // Marcar assentos como reservados
      for (const seat of seatsWithLock) {
        seat.updateStatus('reserved');
        await this.seatRepository.update(seat);
      }
    });

    return this.mapToResponse(reservation);
  }

  private mapToResponse(reservation: Reservation): ReservationResponseDTO {
    return {
      id: reservation.getId(),
      sessionId: reservation.getSessionId(),
      userId: reservation.getUserId(),
      seatNumbers: reservation.getSeatNumbers(),
      totalPriceInCents: reservation.getTotalPrice().getValue(),
      status: reservation.getStatus(),
      expiresAt: reservation.getExpiresAt(),
      createdAt: reservation.getCreatedAt(),
    };
  }
}
