import { Injectable } from '@nestjs/common';

import { ConfirmPaymentRequestDTO, SaleResponseDTO } from '@application/dtos';
import { Sale } from '@domain/booking/entities/sale.entity';
import type { IReservationRepository } from '@domain/booking/repositories/reservation.repository';
import type { ISaleRepository } from '@domain/booking/repositories/sale.repository';
import { UnitOfWork } from '@infrastructure/database/unit-of-work';

@Injectable()
export class ConfirmPaymentUseCase {
  constructor(
    private readonly unitOfWork: UnitOfWork,
    private readonly reservationRepository: IReservationRepository,
    private readonly saleRepository: ISaleRepository,
  ) {}

  async execute(input: ConfirmPaymentRequestDTO): Promise<SaleResponseDTO> {
    let sale: Sale;

    await this.unitOfWork.transaction(async () => {
      const reservation = await this.reservationRepository.findById(
        input.reservationId,
      );

      if (!reservation) {
        throw new Error(`Reservation with id ${input.reservationId} not found`);
      }

      if (!reservation.canBeConfirmed()) {
        throw new Error(
          `Reservation is ${reservation.getStatus()}, cannot be confirmed`,
        );
      }

      // Validar que o valor pago é correto
      if (input.paidAmountInCents !== reservation.getTotalPrice().getValue()) {
        throw new Error(
          `Paid amount ${input.paidAmountInCents} does not match reservation total ${reservation.getTotalPrice().getValue()}`,
        );
      }

      // Confirmar reserva
      reservation.confirm();
      await this.reservationRepository.update(reservation);

      // Criar sale
      sale = Sale.create({
        reservationId: reservation.getId(),
        sessionId: reservation.getSessionId(),
        userId: reservation.getUserId(),
        seatNumbers: reservation.getSeatNumbers(),
        totalPrice: reservation.getTotalPrice(),
      });

      await this.saleRepository.create(sale);
    });

    return this.mapToResponse(sale);
  }

  private mapToResponse(sale: Sale): SaleResponseDTO {
    return {
      id: sale.getId(),
      reservationId: sale.getReservationId(),
      sessionId: sale.getSessionId(),
      userId: sale.getUserId(),
      seatNumbers: sale.getSeatNumbers(),
      totalPriceInCents: sale.getTotalPrice().getValue(),
      confirmedAt: sale.getConfirmedAt(),
    };
  }
}
