import { Controller, Get, Param, Version } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';

import {
  UserPurchaseHistoryResponseDTO,
  GetPurchaseHistoryRequestDTO,
} from '@application/dtos';
import { GetUserPurchaseHistoryUseCase } from '@application/use-cases';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(
    private readonly getUserPurchaseHistoryUseCase: GetUserPurchaseHistoryUseCase,
  ) {}

  @Get(':userId/purchases')
  @Version('1')
  @ApiOperation({
    summary: 'Get user purchase history',
    description:
      'Retrieves the complete purchase history for a specific user including all completed sales',
  })
  @ApiParam({
    name: 'userId',
    description: 'Unique identifier of the user',
    example: 'user-456',
  })
  @ApiResponse({
    status: 200,
    description: 'Purchase history retrieved successfully',
    type: UserPurchaseHistoryResponseDTO,
    schema: {
      example: {
        userId: 'user-456',
        purchases: [
          {
            saleId: 'sale-123',
            sessionId: 'sess-789',
            movieTitle: 'The Matrix',
            showTime: '2024-01-15T20:00:00.000Z',
            seatNumbers: [5, 6],
            totalPriceInCents: 5000,
            purchaseDate: '2024-01-15T19:30:00.000Z',
          },
        ],
        totalPurchases: 1,
        totalSpentInCents: 5000,
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'User not found or no purchases found',
  })
  async getPurchaseHistory(
    @Param('userId') userId: string,
  ): Promise<UserPurchaseHistoryResponseDTO> {
    const dto: GetPurchaseHistoryRequestDTO = { userId };
    return this.getUserPurchaseHistoryUseCase.execute(dto);
  }
}
