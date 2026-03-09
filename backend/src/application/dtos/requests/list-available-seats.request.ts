import { IsString, IsUUID } from 'class-validator';

export class ListAvailableSeatsRequestDTO {
  @IsString()
  @IsUUID()
  sessionId: string;
}
