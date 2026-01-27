import { Injectable } from '@nestjs/common';

import {
  CreateReservationRequestDTO,
  ReservationResponseDTO,
} from '@application/dtos';
import { Reservation } from '@domain/booking/entities/reservation.entity';
import type { IReservationRepository } from '@domain/booking/repositories/reservation.repository';
import type { ISeatRepository } from '@domain/cinema/repositories/seat.repository';
import type { ISessionRepository } from '@domain/cinema/repositories/session.repository';
import type { IUserRepository } from '@domain/user/repositories/user.repository';
import { UnitOfWork } from '@infrastructure/database/unit-of-work';
import { DistributedLockService } from '@infrastructure/cache';
import { EventsPublisherService } from '@infrastructure/events';
import { EmailNotificationService } from '@infrastructure/notifications/email-notification.service';
import {
  SessionNotFoundException,
  SeatNotAvailableException,
} from '@domain/cinema/exceptions';

@Injectable()
export class CreateReservationUseCase {
  constructor(
    private readonly unitOfWork: UnitOfWork,
    private readonly sessionRepository: ISessionRepository,
    private readonly seatRepository: ISeatRepository,
    private readonly reservationRepository: IReservationRepository,
    private readonly userRepository: IUserRepository,
    private readonly distributedLockService: DistributedLockService,
    private readonly eventsPublisher: EventsPublisherService,
    private readonly emailNotificationService: EmailNotificationService,
  ) {}

  async execute(
    input: CreateReservationRequestDTO,
  ): Promise<ReservationResponseDTO> {
    const session = await this.sessionRepository.findById(input.sessionId);

    if (!session) {
      throw new SessionNotFoundException(input.sessionId);
    }

    let reservation: Reservation;

    try {
      await this.distributedLockService.executeWithLocks(
        this.buildSeatLockResources(input.sessionId, input.seatNumbers),
        async () => {
          await this.unitOfWork.transactionPessimistic(async () => {
            // Lock pessimista para evitar race condition
            const seatsWithLock =
              await this.seatRepository.findWithPessimisticLock(
                input.sessionId,
                input.seatNumbers,
              );

            // Validar que todos os assentos estão disponíveis
            const unavailableSeats = seatsWithLock.filter(
              (s) => s.status !== 'available',
            );
            if (unavailableSeats.length > 0) {
              throw new SeatNotAvailableException(
                input.sessionId,
                unavailableSeats.map((s) => s.seatNumber.getValue()),
              );
            }

            // Criar reserva
            const totalPrice = session
              .getPrice()
              .multiply(input.seatNumbers.length);
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
        },
        {
          ttl: 30000,
          globalTimeoutMs: 6000,
        },
      );
    } catch {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      throw new LockAcquisitionFailedException('reservation');
    }

    // Publicar evento de reserva criada
    await this.eventsPublisher.publishReservationCreated({
      reservationId: reservation.getId(),
      sessionId: reservation.getSessionId(),
      userId: reservation.getUserId(),
      seatNumbers: reservation.getSeatNumbers(),
      totalPriceInCents: reservation.getTotalPrice().getValue(),
      expiresAt: reservation.getExpiresAt(),
      createdAt: reservation.getCreatedAt(),
    });

    // Enviar notificação por email
    try {
      const user = await this.userRepository.findById(input.userId);
      if (user) {
        await this.emailNotificationService.sendReservationConfirmation(
          user.getEmail(),
          {
            customerName: `${user.getFirstName()} ${user.getLastName()}`,
            movieTitle: session.getMovieTitle(),
            showTime: session.getShowTime().toISOString(),
            seatNumbers: reservation.getSeatNumbers(),
            totalPrice: reservation.getTotalPrice().getValue(),
            reservationId: reservation.getId(),
          },
        );
      }
    } catch (error) {
      // Não falhar a reserva por causa de erro na notificação
      console.error('Failed to send reservation confirmation email:', error);
    }

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

  private buildSeatLockResources(
    sessionId: string,
    seatNumbers: number[],
  ): string[] {
    return Array.from(new Set(seatNumbers)).map(
      (seatNumber) => `seat:${sessionId}:${seatNumber}`,
    );
  }
}
