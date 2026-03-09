import { Injectable } from '@nestjs/common';

import {
  GetPurchaseHistoryRequestDTO,
  SaleResponseDTO,
} from '@application/dtos';
import { Sale as SaleDomain } from '@domain/booking/entities/sale.entity';
import type { ISaleRepository } from '@domain/booking/repositories/sale.repository';

@Injectable()
export class GetUserPurchaseHistoryUseCase {
  constructor(private readonly saleRepository: ISaleRepository) {}

  async execute(
    input: GetPurchaseHistoryRequestDTO,
  ): Promise<SaleResponseDTO[]> {
    const sales = await this.saleRepository.findByUserId(input.userId);

    return sales.map((sale) => this.mapToResponse(sale));
  }

  private mapToResponse(sale: SaleDomain): SaleResponseDTO {
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
