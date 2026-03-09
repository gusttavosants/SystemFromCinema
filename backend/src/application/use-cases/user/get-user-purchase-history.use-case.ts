import { Injectable, Inject } from '@nestjs/common';

import {
  UserPurchaseHistoryResponseDTO,
  GetPurchaseHistoryRequestDTO,
} from '@application/dtos';
import type { ISaleRepository } from '@domain/booking/repositories/sale.repository';
import type { ISessionRepository } from '@domain/cinema/repositories/session.repository';
import { CacheService } from '@infrastructure/cache/cache.service';

@Injectable()
export class GetUserPurchaseHistoryUseCase {
  constructor(
    @Inject('ISaleRepository')
    private readonly saleRepository: ISaleRepository,
    @Inject('ISessionRepository')
    private readonly sessionRepository: ISessionRepository,
    private readonly cacheService: CacheService,
  ) {}

  async execute(
    dto: GetPurchaseHistoryRequestDTO,
  ): Promise<UserPurchaseHistoryResponseDTO> {
    const cacheKey = `user_purchase_history:${dto.userId}`;

    // Try to get from cache first
    const cachedResult =
      await this.cacheService.get<UserPurchaseHistoryResponseDTO>(cacheKey);
    if (cachedResult) {
      return cachedResult;
    }

    const sales = await this.saleRepository.findByUserId(dto.userId);

    const purchases = await Promise.all(
      sales.map(async (sale) => {
        const session = await this.sessionRepository.findById(
          sale.getSessionId(),
        );

        return {
          saleId: sale.getId(),
          sessionId: sale.getSessionId(),
          movieTitle: session?.getMovieTitle() ?? 'Unknown',
          showTime:
            session?.getShowTime()?.toISOString() ?? new Date().toISOString(),
          seatNumbers: sale.getSeatNumbers(),
          totalPriceInCents: sale.getTotalPrice().getValue(),
          purchaseDate: sale.getConfirmedAt(),
        };
      }),
    );

    const totalSpentInCents = purchases.reduce(
      (total, purchase) => total + purchase.totalPriceInCents,
      0,
    );

    const result: UserPurchaseHistoryResponseDTO = {
      userId: dto.userId,
      purchases,
      totalPurchases: purchases.length,
      totalSpentInCents,
    };

    // Cache the result for 10 minutes
    await this.cacheService.set(cacheKey, result, 600000);

    return result;
  }
}
