import { Body, Controller, Get, Param, Post, Version } from '@nestjs/common';

import { CreateSessionRequestDTO, SessionResponseDTO } from '@application/dtos';
import { CreateSessionUseCase } from '@application/use-cases';
import { ListAvailableSeatsUseCase } from '@application/use-cases';

@Controller('sessions')
export class SessionsController {
  constructor(
    private readonly createSessionUseCase: CreateSessionUseCase,
    private readonly listAvailableSeatsUseCase: ListAvailableSeatsUseCase,
  ) {}

  @Post()
  @Version('1')
  async create(
    @Body() createSessionDto: CreateSessionRequestDTO,
  ): Promise<SessionResponseDTO> {
    return this.createSessionUseCase.execute(createSessionDto);
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
