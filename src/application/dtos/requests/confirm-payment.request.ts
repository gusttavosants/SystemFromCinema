import { IsNumber, IsPositive, IsString, IsUUID } from 'class-validator';

export class ConfirmPaymentRequestDTO {
  @IsString()
  @IsUUID()
  reservationId: string;

  @IsNumber()
  @IsPositive()
  paidAmountInCents: number;
}
