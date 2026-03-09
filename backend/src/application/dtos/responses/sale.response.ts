import { ApiProperty } from '@nestjs/swagger';

export class SaleResponseDTO {
  @ApiProperty({
    description: 'Unique identifier of the sale',
    example: 'sale-123',
  })
  id: string;

  @ApiProperty({
    description: 'Unique identifier of the associated reservation',
    example: 'res-789',
  })
  reservationId: string;

  @ApiProperty({
    description: 'Unique identifier of the session',
    example: 'sess-123',
  })
  sessionId: string;

  @ApiProperty({
    description: 'Unique identifier of the user who made the purchase',
    example: 'user-456',
  })
  userId: string;

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
    description: 'Date and time when the payment was confirmed',
    example: '2024-01-15T19:45:00.000Z',
  })
  confirmedAt: Date;
}
