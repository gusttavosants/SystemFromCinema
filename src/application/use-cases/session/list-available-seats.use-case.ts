import { Injectable } from '@nestjs/common';

import {
  ListAvailableSeatsRequestDTO,
  SeatResponseDTO,
} from '@application/dtos';
import { Seat as SeatDomain } from '@domain/cinema/entities/seat.entity';
import type { ISeatRepository } from '@domain/cinema/repositories/seat.repository';
import type { ISessionRepository } from '@domain/cinema/repositories/session.repository';

@Injectable()
export class ListAvailableSeatsUseCase {
  constructor(
    private readonly sessionRepository: ISessionRepository,
    private readonly seatRepository: ISeatRepository,
  ) {}

  async execute(
    input: ListAvailableSeatsRequestDTO,
  ): Promise<SeatResponseDTO[]> {
    const session = await this.sessionRepository.findById(input.sessionId);

    if (!session) {
      throw new Error(`Session with id ${input.sessionId} not found`);
    }

    const availableSeats =
      await this.seatRepository.findAvailableSeatsBySession(input.sessionId);

    return availableSeats.map((seat) => this.mapToResponse(seat));
  }

  private mapToResponse(seat: SeatDomain): SeatResponseDTO {
    return {
      id: seat.id,
      sessionId: seat.sessionId,
      seatNumber: seat.seatNumber.getValue(),
      status: seat.status,
    };
  }
}
