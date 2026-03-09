import { Body, Controller, Get, Param, Post, Version } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';

import {
  CreateSessionRequestDTO,
  SessionResponseDTO,
  SessionAvailabilityResponseDTO,
} from '@application/dtos';
import {
  CreateSessionUseCase,
  ListAvailableSeatsUseCase,
  GetSessionAvailabilityUseCase,
} from '@application/use-cases';
import { KafkaProducerService } from '@infrastructure/messaging';

@ApiTags('sessions')
@Controller('sessions')
export class SessionsController {
  constructor(
    private readonly createSessionUseCase: CreateSessionUseCase,
    private readonly listAvailableSeatsUseCase: ListAvailableSeatsUseCase,
    private readonly getSessionAvailabilityUseCase: GetSessionAvailabilityUseCase,
    private readonly eventPublisher: KafkaProducerService,
  ) {}

  @Post()
  @Version('1')
  @ApiOperation({
    summary: 'Create a new cinema session',
    description:
      'Creates a new movie session with specified show time and pricing',
  })
  @ApiBody({
    type: CreateSessionRequestDTO,
    description: 'Session creation data',
    examples: {
      example: {
        summary: 'Create movie session',
        value: {
          movieTitle: 'The Matrix',
          showTime: '2024-01-15T20:00:00Z',
          totalSeats: 100,
          priceInCents: 2500,
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Session created successfully',
    type: SessionResponseDTO,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input data',
  })
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
  @ApiOperation({
    summary: 'Get session details',
    description: 'Retrieves details of a specific cinema session',
  })
  @ApiParam({
    name: 'sessionId',
    description: 'Unique identifier of the session',
    example: 'sess-123',
  })
  @ApiResponse({
    status: 200,
    description: 'Session details retrieved successfully',
    type: SessionResponseDTO,
  })
  @ApiResponse({
    status: 404,
    description: 'Session not found',
  })
  getById(): Promise<SessionResponseDTO> {
    throw new Error('Not implemented');
  }

  @Get(':sessionId/available-seats')
  @Version('1')
  @ApiOperation({
    summary: 'Get available seats (deprecated)',
    description:
      'Retrieves list of available seats for a session. Use /availability endpoint instead.',
    deprecated: true,
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
  async getAvailableSeats(@Param('sessionId') sessionId: string): Promise<any> {
    return this.listAvailableSeatsUseCase.execute({ sessionId });
  }

  @Get(':sessionId/availability')
  @Version('1')
  @ApiOperation({
    summary: 'Get session availability',
    description:
      'Retrieves real-time availability information for a cinema session including available, reserved, and sold seats',
  })
  @ApiParam({
    name: 'sessionId',
    description: 'Unique identifier of the session',
    example: 'sess-123',
  })
  @ApiResponse({
    status: 200,
    description: 'Session availability retrieved successfully',
    type: SessionAvailabilityResponseDTO,
    schema: {
      example: {
        sessionId: 'sess-123',
        totalSeats: 100,
        availableSeats: [
          { seatNumber: 1, status: 'available' },
          { seatNumber: 2, status: 'available' },
        ],
        reservedSeats: [{ seatNumber: 5, status: 'reserved' }],
        soldSeats: [{ seatNumber: 10, status: 'sold' }],
        lastUpdated: '2024-01-15T10:30:00.000Z',
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Session not found',
  })
  async getAvailability(
    @Param('sessionId') sessionId: string,
  ): Promise<SessionAvailabilityResponseDTO> {
    return this.getSessionAvailabilityUseCase.execute(sessionId);
  }
}
