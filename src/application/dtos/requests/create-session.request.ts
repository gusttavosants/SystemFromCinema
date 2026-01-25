import {
  IsDateString,
  IsNumber,
  IsPositive,
  IsString,
  MinLength,
} from 'class-validator';

export class CreateSessionRequestDTO {
  @IsString()
  @MinLength(1)
  movieTitle: string;

  @IsString()
  @MinLength(1)
  room: string;

  @IsDateString()
  showTime: string;

  @IsNumber()
  @IsPositive()
  priceInCents: number;

  @IsNumber()
  @IsPositive()
  totalSeats: number;
}
