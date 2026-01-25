import { Body, Controller, Post, Version } from '@nestjs/common';

import { ConfirmPaymentRequestDTO, SaleResponseDTO } from '@application/dtos';
import { ConfirmPaymentUseCase } from '@application/use-cases';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly confirmPaymentUseCase: ConfirmPaymentUseCase) {}

  @Post('confirm')
  @Version('1')
  async confirmPayment(
    @Body() confirmPaymentDto: ConfirmPaymentRequestDTO,
  ): Promise<SaleResponseDTO> {
    return this.confirmPaymentUseCase.execute(confirmPaymentDto);
  }
}
