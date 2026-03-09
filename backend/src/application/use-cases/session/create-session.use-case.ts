import { Injectable, Inject } from '@nestjs/common';

import { CreateSessionRequestDTO, SessionResponseDTO } from '@application/dtos';
import { Session } from '@domain/cinema/entities/session.entity';
import { Price } from '@domain/cinema/value-objects/price.vo';
import type { ISessionRepository } from '@domain/cinema/repositories/session.repository';
import { UnitOfWork } from '@infrastructure/database/unit-of-work';

@Injectable()
export class CreateSessionUseCase {
  constructor(
    private readonly unitOfWork: UnitOfWork,
    @Inject('ISessionRepository')
    private readonly sessionRepository: ISessionRepository,
  ) {}

  async execute(input: CreateSessionRequestDTO): Promise<SessionResponseDTO> {
    const price = new Price(input.priceInCents);
    const showTime = new Date(input.showTime);

    const session = Session.create({
      movieTitle: input.movieTitle,
      room: input.room,
      showTime,
      price,
      totalSeats: input.totalSeats,
    });

    await this.unitOfWork.transaction(async () => {
      await this.sessionRepository.create(session);
    });

    return this.mapToResponse(session);
  }

  private mapToResponse(session: Session): SessionResponseDTO {
    return {
      id: session.getId(),
      movieTitle: session.getMovieTitle(),
      room: session.getRoom(),
      showTime: session.getShowTime().toISOString(),
      priceInCents: session.getPrice().getValue(),
      totalSeats: session.getTotalSeats(),
      createdAt: session.getCreatedAt(),
    };
  }
}
