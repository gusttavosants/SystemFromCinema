import { Body, Controller, Post, Version } from '@nestjs/common';

import { ConfirmPaymentRequestDTO, SaleResponseDTO } from '@application/dtos';
import { ConfirmPaymentUseCase } from '@application/use-cases';
import { KafkaProducerService } from '@infrastructure/messaging';

@Controller('payments')
export class PaymentsController {
  constructor(
    private readonly confirmPaymentUseCase: ConfirmPaymentUseCase,
    private readonly eventPublisher: KafkaProducerService,
  ) {}

  @Post('confirm')
  @Version('1')
  async confirmPayment(
    @Body() confirmPaymentDto: ConfirmPaymentRequestDTO,
  ): Promise<SaleResponseDTO> {
    const payment = await this.confirmPaymentUseCase.execute(confirmPaymentDto);

    await this.eventPublisher.publishEvent('PaymentConfirmed', {
      paymentId: payment.id,
      reservationId: payment.reservationId,
      amount: payment.totalPriceInCents,
      method: 'credit_card',
      timestamp: new Date(),
    });

    return payment;
  }
}
