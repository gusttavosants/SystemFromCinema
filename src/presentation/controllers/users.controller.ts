import { Controller, Get, Param, Version } from '@nestjs/common';

import { SaleResponseDTO } from '@application/dtos';
import { GetUserPurchaseHistoryUseCase } from '@application/use-cases';

@Controller('users')
export class UsersController {
  constructor(
    private readonly getUserPurchaseHistoryUseCase: GetUserPurchaseHistoryUseCase,
  ) {}

  @Get(':userId/purchase-history')
  @Version('1')
  async getPurchaseHistory(
    @Param('userId') userId: string,
  ): Promise<SaleResponseDTO[]> {
    return this.getUserPurchaseHistoryUseCase.execute({ userId });
  }
}
