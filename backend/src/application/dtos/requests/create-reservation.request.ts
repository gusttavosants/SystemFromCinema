import {
  IsArray,
  IsNumber,
  IsPositive,
  IsString,
  IsUUID,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateReservationRequestDTO {
  @ApiProperty({
    description: 'Unique identifier of the cinema session',
    example: 'sess-123',
  })
  @IsString()
  @IsUUID()
  sessionId: string;

  @ApiProperty({
    description: 'Unique identifier of the user making the reservation',
    example: 'user-456',
  })
  @IsString()
  @IsUUID()
  userId: string;

  @ApiProperty({
    description: 'Array of seat numbers to reserve',
    example: [5, 6, 7],
    type: [Number],
    minItems: 1,
  })
  @IsArray()
  @IsNumber({}, { each: true })
  @IsPositive({ each: true })
  seatNumbers: number[];
}
