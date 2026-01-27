import {
  IsDateString,
  IsNumber,
  IsPositive,
  IsString,
  MinLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateSessionRequestDTO {
  @ApiProperty({
    description: 'Title of the movie being shown',
    example: 'The Matrix',
    minLength: 1,
  })
  @IsString()
  @MinLength(1)
  movieTitle: string;

  @ApiProperty({
    description: 'Room or theater where the session will take place',
    example: 'Sala 1',
    minLength: 1,
  })
  @IsString()
  @MinLength(1)
  room: string;

  @ApiProperty({
    description: 'Date and time when the session starts (ISO 8601 format)',
    example: '2024-01-15T20:00:00Z',
  })
  @IsDateString()
  showTime: string;

  @ApiProperty({
    description: 'Price per seat in cents',
    example: 2500,
    minimum: 1,
  })
  @IsNumber()
  @IsPositive()
  priceInCents: number;

  @ApiProperty({
    description: 'Total number of seats available in the session',
    example: 100,
    minimum: 1,
  })
  @IsNumber()
  @IsPositive()
  totalSeats: number;
}
