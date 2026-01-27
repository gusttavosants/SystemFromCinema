import { Body, Controller, Post, Version } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';

import { ConfirmPaymentRequestDTO, SaleResponseDTO } from '@application/dtos';
import { ConfirmPaymentUseCase } from '@application/use-cases';
import { KafkaProducerService } from '@infrastructure/messaging';

@ApiTags('payments')
@Controller('payments')
export class PaymentsController {
  constructor(
    private readonly confirmPaymentUseCase: ConfirmPaymentUseCase,
    private readonly eventPublisher: KafkaProducerService,
  ) {}

  @Post('confirm')
  @Version('1')
  @ApiOperation({
    summary: 'Confirm payment for reservation',
    description:
      'Confirms payment for a reservation, converts it to a sale, and releases the seats as sold',
  })
  @ApiBody({
    type: ConfirmPaymentRequestDTO,
    description: 'Payment confirmation data',
    examples: {
      example: {
        summary: 'Confirm payment',
        value: {
          reservationId: 'res-789',
          paidAmountInCents: 5000,
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Payment confirmed successfully',
    type: SaleResponseDTO,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid payment amount or reservation data',
  })
  @ApiResponse({
    status: 404,
    description: 'Reservation not found',
  })
  @ApiResponse({
    status: 409,
    description:
      'Reservation cannot be confirmed (expired or already confirmed)',
  })
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
