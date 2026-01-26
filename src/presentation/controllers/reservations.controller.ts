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
import { KafkaProducerService } from '@infrastructure/messaging';

@Controller('reservations')
export class ReservationsController {
  constructor(
    private readonly createReservationUseCase: CreateReservationUseCase,
    private readonly listAvailableSeatsUseCase: ListAvailableSeatsUseCase,
    private readonly eventPublisher: KafkaProducerService,
  ) {}

  @Post()
  @Version('1')
  async create(
    @Body() createReservationDto: CreateReservationRequestDTO,
  ): Promise<ReservationResponseDTO> {
    const reservation =
      await this.createReservationUseCase.execute(createReservationDto);

    await this.eventPublisher.publishEvent('ReservationCreated', {
      reservationId: reservation.id,
      sessionId: reservation.sessionId,
      userId: reservation.userId,
      seatNumber: reservation.seatNumbers[0] || 0,
      quantity: reservation.seatNumbers.length,
      totalPrice: reservation.totalPriceInCents,
      timestamp: new Date(),
    });

    return reservation;
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
