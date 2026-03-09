import { IsNumber, IsPositive, IsString, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ConfirmPaymentRequestDTO {
  @ApiProperty({
    description: 'Unique identifier of the reservation to confirm payment for',
    example: 'res-789',
  })
  @IsString()
  @IsUUID()
  reservationId: string;

  @ApiProperty({
    description: 'Amount paid in cents (must match the reservation total)',
    example: 5000,
    minimum: 1,
  })
  @IsNumber()
  @IsPositive()
  paidAmountInCents: number;
}
