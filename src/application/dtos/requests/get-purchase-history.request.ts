import { IsString, IsUUID } from 'class-validator';

export class GetPurchaseHistoryRequestDTO {
  @IsString()
  @IsUUID()
  userId: string;
}
