import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Version,
} from '@nestjs/common';

import {
  CreateReservationRequestDTO,
  ListAvailableSeatsRequestDTO,
  ReservationResponseDTO,
} from '@application/dtos';
import {
  CreateReservationUseCase,
  ListAvailableSeatsUseCase,
} from '@application/use-cases';

@Controller('reservations')
export class ReservationsController {
  constructor(
    private readonly createReservationUseCase: CreateReservationUseCase,
    private readonly listAvailableSeatsUseCase: ListAvailableSeatsUseCase,
  ) {}

  @Post()
  @Version('1')
  async create(
    @Body() createReservationDto: CreateReservationRequestDTO,
  ): Promise<ReservationResponseDTO> {
    return this.createReservationUseCase.execute(createReservationDto);
  }

  @Get(':reservationId')
  @Version('1')
  getById(): Promise<ReservationResponseDTO> {
    // TODO: Implementar GetReservationByIdUseCase
    throw new Error('Not implemented');
  }

  @Get('session/:sessionId/seats')
  @Version('1')
  async getSessionAvailableSeats(
    @Param('sessionId') sessionId: string,
  ): Promise<any> {
    const dto: ListAvailableSeatsRequestDTO = { sessionId };
    return this.listAvailableSeatsUseCase.execute(dto);
  }

  @Delete(':reservationId')
  @Version('1')
  cancel(): Promise<{ success: boolean }> {
    // TODO: Implementar CancelReservationUseCase
    throw new Error('Not implemented');
  }
}
