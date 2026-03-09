import { IsString, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GetPurchaseHistoryRequestDTO {
  @ApiProperty({
    description: 'Unique identifier of the user',
    example: 'user-456',
  })
  @IsString()
  @IsUUID()
  userId: string;
}
