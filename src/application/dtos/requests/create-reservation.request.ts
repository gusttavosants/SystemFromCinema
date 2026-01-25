import {
  IsArray,
  IsNumber,
  IsPositive,
  IsString,
  IsUUID,
} from 'class-validator';

export class CreateReservationRequestDTO {
  @IsString()
  @IsUUID()
  sessionId: string;

  @IsString()
  @IsUUID()
  userId: string;

  @IsArray()
  @IsNumber({}, { each: true })
  @IsPositive({ each: true })
  seatNumbers: number[];
}
