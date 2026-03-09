import { ApiProperty } from '@nestjs/swagger';

export class SessionResponseDTO {
  @ApiProperty({
    description: 'Unique identifier of the session',
    example: 'sess-123',
  })
  id: string;

  @ApiProperty({
    description: 'Title of the movie being shown',
    example: 'The Matrix',
  })
  movieTitle: string;

  @ApiProperty({
    description: 'Room or theater where the session takes place',
    example: 'Sala 1',
  })
  room: string;

  @ApiProperty({
    description: 'Date and time when the session starts (ISO 8601 format)',
    example: '2024-01-15T20:00:00.000Z',
  })
  showTime: string;

  @ApiProperty({
    description: 'Price per seat in cents',
    example: 2500,
  })
  priceInCents: number;

  @ApiProperty({
    description: 'Total number of seats available in the session',
    example: 100,
  })
  totalSeats: number;

  @ApiProperty({
    description: 'Date and time when the session was created',
    example: '2024-01-10T10:00:00.000Z',
  })
  createdAt: Date;
}
