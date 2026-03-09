import { ApiProperty } from '@nestjs/swagger';

export class SeatAvailabilityDTO {
  @ApiProperty({
    description: 'Seat number',
    example: 5,
  })
  seatNumber: number;

  @ApiProperty({
    description: 'Current status of the seat',
    example: 'available',
    enum: ['available', 'reserved', 'sold'],
  })
  status: 'available' | 'reserved' | 'sold';
}

export class SessionAvailabilityResponseDTO {
  @ApiProperty({
    description: 'Unique identifier of the session',
    example: 'sess-123',
  })
  sessionId: string;

  @ApiProperty({
    description: 'Total number of seats in the session',
    example: 100,
  })
  totalSeats: number;

  @ApiProperty({
    description: 'List of available seats',
    type: [SeatAvailabilityDTO],
  })
  availableSeats: SeatAvailabilityDTO[];

  @ApiProperty({
    description: 'List of reserved seats',
    type: [SeatAvailabilityDTO],
  })
  reservedSeats: SeatAvailabilityDTO[];

  @ApiProperty({
    description: 'List of sold seats',
    type: [SeatAvailabilityDTO],
  })
  soldSeats: SeatAvailabilityDTO[];

  @ApiProperty({
    description: 'Date and time when availability was last updated',
    example: '2024-01-15T10:30:00.000Z',
  })
  lastUpdated: Date;
}

export class UserPurchaseDTO {
  @ApiProperty({
    description: 'Unique identifier of the sale',
    example: 'sale-123',
  })
  saleId: string;

  @ApiProperty({
    description: 'Unique identifier of the session',
    example: 'sess-789',
  })
  sessionId: string;

  @ApiProperty({
    description: 'Movie title of the session',
    example: 'The Matrix',
  })
  movieTitle: string;

  @ApiProperty({
    description: 'Date and time of the session',
    example: '2024-01-15T20:00:00.000Z',
  })
  showTime: string;

  @ApiProperty({
    description: 'Array of purchased seat numbers',
    example: [5, 6],
    type: [Number],
  })
  seatNumbers: number[];

  @ApiProperty({
    description: 'Total price paid in cents',
    example: 5000,
  })
  totalPriceInCents: number;

  @ApiProperty({
    description: 'Date and time when the purchase was made',
    example: '2024-01-15T19:30:00.000Z',
  })
  purchaseDate: Date;
}

export class UserPurchaseHistoryResponseDTO {
  @ApiProperty({
    description: 'Unique identifier of the user',
    example: 'user-456',
  })
  userId: string;

  @ApiProperty({
    description: 'List of user purchases',
    type: [UserPurchaseDTO],
  })
  purchases: UserPurchaseDTO[];

  @ApiProperty({
    description: 'Total number of purchases made by the user',
    example: 3,
  })
  totalPurchases: number;

  @ApiProperty({
    description: 'Total amount spent by the user in cents',
    example: 15000,
  })
  totalSpentInCents: number;
}
