import { Body, Controller, Get, Param, Post, Version } from '@nestjs/common';

import { CreateSessionRequestDTO, SessionResponseDTO } from '@application/dtos';
import { CreateSessionUseCase } from '@application/use-cases';
import { ListAvailableSeatsUseCase } from '@application/use-cases';
import { EventPublisherService } from '@infrastructure/messaging';

@Controller('sessions')
export class SessionsController {
  constructor(
    private readonly createSessionUseCase: CreateSessionUseCase,
    private readonly listAvailableSeatsUseCase: ListAvailableSeatsUseCase,
    private readonly eventPublisher: EventPublisherService,
  ) {}

  @Post()
  @Version('1')
  async create(
    @Body() createSessionDto: CreateSessionRequestDTO,
  ): Promise<SessionResponseDTO> {
    const session = await this.createSessionUseCase.execute(createSessionDto);

    await this.eventPublisher.publishEvent('SessionCreated', {
      sessionId: session.id,
      movieId: session.movieTitle,
      startTime: new Date(session.showTime),
      availableSeats: session.totalSeats,
      timestamp: new Date(),
    });

    return session;
  }

  @Get(':sessionId')
  @Version('1')
  getById(): Promise<SessionResponseDTO> {
    // TODO: Implementar GetSessionByIdUseCase
    throw new Error('Not implemented');
  }

  @Get(':sessionId/available-seats')
  @Version('1')
  async getAvailableSeats(@Param('sessionId') sessionId: string): Promise<any> {
    return this.listAvailableSeatsUseCase.execute({ sessionId });
  }
}
