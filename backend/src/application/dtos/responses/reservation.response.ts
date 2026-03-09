import { ApiProperty } from '@nestjs/swagger';

export class ReservationResponseDTO {
  @ApiProperty({
    description: 'Unique identifier of the reservation',
    example: 'res-789',
  })
  id: string;

  @ApiProperty({
    description: 'Unique identifier of the associated session',
    example: 'sess-123',
  })
  sessionId: string;

  @ApiProperty({
    description: 'Unique identifier of the user who made the reservation',
    example: 'user-456',
  })
  userId: string;

  @ApiProperty({
    description: 'Array of reserved seat numbers',
    example: [5, 6, 7],
    type: [Number],
  })
  seatNumbers: number[];

  @ApiProperty({
    description: 'Total price of the reservation in cents',
    example: 7500,
  })
  totalPriceInCents: number;

  @ApiProperty({
    description: 'Current status of the reservation',
    example: 'pending',
    enum: ['pending', 'confirmed', 'expired', 'cancelled'],
  })
  status: 'pending' | 'confirmed' | 'expired' | 'cancelled';

  @ApiProperty({
    description: 'Date and time when the reservation expires',
    example: '2024-01-15T19:30:00.000Z',
  })
  expiresAt: Date;

  @ApiProperty({
    description: 'Date and time when the reservation was created',
    example: '2024-01-15T19:15:00.000Z',
  })
  createdAt: Date;
}
