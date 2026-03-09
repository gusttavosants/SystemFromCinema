import { Injectable, Inject } from '@nestjs/common';

import { SessionAvailabilityResponseDTO } from '@application/dtos';
import type { ISessionRepository } from '@domain/cinema/repositories/session.repository';
import type { ISeatRepository } from '@domain/cinema/repositories/seat.repository';
import type { IReservationRepository } from '@domain/booking/repositories/reservation.repository';
import { RedisService } from '@infrastructure/cache';

@Injectable()
export class GetSessionAvailabilityUseCase {
  constructor(
    @Inject('ISessionRepository')
    private readonly sessionRepository: ISessionRepository,
    @Inject('ISeatRepository')
    private readonly seatRepository: ISeatRepository,
    @Inject('IReservationRepository')
    private readonly reservationRepository: IReservationRepository,
    private readonly redisService: RedisService,
  ) {}

  async execute(sessionId: string): Promise<SessionAvailabilityResponseDTO> {
    const cacheKey = `session:availability:${sessionId}`;

    // Try cache first
    const cached = await this.redisService.get(cacheKey);
    if (cached) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      return JSON.parse(cached);
    }

    // Get session
    const session = await this.sessionRepository.findById(sessionId);
    if (!session) {
      throw new Error(`Session with id ${sessionId} not found`);
    }

    // Get all seats for session
    const seats = await this.seatRepository.findBySessionId(sessionId);

    // Get active reservations (pending + confirmed)

    const reservations =
      await this.reservationRepository.findPendingReservationsBySession(
        sessionId,
      );

    // Calculate availability

    const reservedSeatNumbers = new Set(
      reservations.flatMap((reservation) => reservation.getSeatNumbers()),
    );

    const availableSeats = seats

      .filter(
        (seat) =>
          seat.status === 'available' &&
          !reservedSeatNumbers.has(seat.seatNumber.getValue()),
      )
      .map((seat) => ({
        seatNumber: seat.seatNumber.getValue(),

        status: seat.status,
      }));

    const reservedSeats = seats

      .filter(
        (seat) =>
          seat.status === 'reserved' ||
          reservedSeatNumbers.has(seat.seatNumber.getValue()),
      )
      .map((seat) => ({
        seatNumber: seat.seatNumber.getValue(),
        status: 'reserved' as const,
      }));

    const soldSeats = seats

      .filter((seat) => seat.status === 'sold')
      .map((seat) => ({
        seatNumber: seat.seatNumber.getValue(),
        status: 'sold' as const,
      }));

    const result: SessionAvailabilityResponseDTO = {
      sessionId,
      totalSeats: seats.length,
      availableSeats,
      reservedSeats,
      soldSeats,
      lastUpdated: new Date(),
    };

    // Cache for 30 seconds
    await this.redisService.set(cacheKey, JSON.stringify(result), 30);

    return result;
  }
}
