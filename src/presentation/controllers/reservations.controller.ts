import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
  Version,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';

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
import { JwtAuthGuard } from '@infrastructure/auth/jwt-auth.guard';

@ApiTags('reservations')
@Controller('reservations')
export class ReservationsController {
  constructor(
    private readonly createReservationUseCase: CreateReservationUseCase,
    private readonly listAvailableSeatsUseCase: ListAvailableSeatsUseCase,
    private readonly eventPublisher: KafkaProducerService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @Version('1')
  @ApiOperation({
    summary: 'Create a seat reservation',
    description:
      'Creates a temporary reservation for one or more seats in a cinema session',
  })
  @ApiBearerAuth()
  @ApiBody({
    type: CreateReservationRequestDTO,
    description: 'Reservation creation data',
    examples: {
      example: {
        summary: 'Reserve seats',
        value: {
          sessionId: 'sess-123',
          userId: 'user-456',
          seatNumbers: [5, 6],
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Reservation created successfully',
    type: ReservationResponseDTO,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input data or seats not available',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - authentication required',
  })
  @ApiResponse({
    status: 404,
    description: 'Session not found',
  })
  @ApiResponse({
    status: 409,
    description: 'Seats already reserved or sold',
  })
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
  @ApiOperation({
    summary: 'Get reservation details',
    description: 'Retrieves details of a specific reservation',
  })
  @ApiParam({
    name: 'reservationId',
    description: 'Unique identifier of the reservation',
    example: 'res-789',
  })
  @ApiResponse({
    status: 200,
    description: 'Reservation details retrieved successfully',
    type: ReservationResponseDTO,
  })
  @ApiResponse({
    status: 404,
    description: 'Reservation not found',
  })
  getById(): Promise<ReservationResponseDTO> {
    // TODO: Implementar GetReservationByIdUseCase
    throw new Error('Not implemented');
  }

  @Get('session/:sessionId/seats')
  @Version('1')
  @ApiOperation({
    summary: 'Get available seats for session',
    description:
      'Retrieves the list of available seats for a specific cinema session',
  })
  @ApiParam({
    name: 'sessionId',
    description: 'Unique identifier of the session',
    example: 'sess-123',
  })
  @ApiResponse({
    status: 200,
    description: 'Available seats retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          seatNumber: { type: 'number', example: 1 },
          status: { type: 'string', example: 'available' },
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Session not found',
  })
  async getSessionAvailableSeats(
    @Param('sessionId') sessionId: string,
  ): Promise<any> {
    const dto: ListAvailableSeatsRequestDTO = { sessionId };
    return this.listAvailableSeatsUseCase.execute(dto);
  }

  @Delete(':reservationId')
  @Version('1')
  @ApiOperation({
    summary: 'Cancel a reservation',
    description:
      'Cancels an existing reservation and releases the seats back to available',
  })
  @ApiParam({
    name: 'reservationId',
    description: 'Unique identifier of the reservation to cancel',
    example: 'res-789',
  })
  @ApiResponse({
    status: 200,
    description: 'Reservation cancelled successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Reservation not found',
  })
  @ApiResponse({
    status: 409,
    description:
      'Reservation cannot be cancelled (already confirmed or expired)',
  })
  cancel(): Promise<{ success: boolean }> {
    throw new Error('Not implemented');
  }
}
