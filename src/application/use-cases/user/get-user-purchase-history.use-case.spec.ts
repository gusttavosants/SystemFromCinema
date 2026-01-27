/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Test, TestingModule } from '@nestjs/testing';
import { GetUserPurchaseHistoryUseCase } from './get-user-purchase-history.use-case';

describe('GetUserPurchaseHistoryUseCase', () => {
  let useCase: GetUserPurchaseHistoryUseCase;
  let mockSaleRepository: any;

  beforeEach(async () => {
    mockSaleRepository = {
      findByUserId: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetUserPurchaseHistoryUseCase,
        {
          provide: 'ISaleRepository',
          useValue: mockSaleRepository,
        },
      ],
    }).compile();

    useCase = module.get<GetUserPurchaseHistoryUseCase>(
      GetUserPurchaseHistoryUseCase,
    );
  });

  describe('execute', () => {
    it('should return user purchase history', async () => {
      const userId = 'user-123';

      const mockSales = [
        {
          getId: () => 'sale-1',
          getSessionId: () => 'session-456',
          getSeatNumbers: () => [1, 2],
          getTotalPrice: () => ({ getValue: () => 3000 }),
          getConfirmedAt: () => new Date('2024-01-01T10:00:00Z'),
        },
        {
          getId: () => 'sale-2',
          getSessionId: () => 'session-789',
          getSeatNumbers: () => [5],
          getTotalPrice: () => ({ getValue: () => 1500 }),
          getConfirmedAt: () => new Date('2024-01-02T14:30:00Z'),
        },
      ];

      mockSaleRepository.findByUserId.mockResolvedValue(mockSales);

      const result = await useCase.execute(userId);

      expect(result.userId).toBe(userId);
      expect(result.purchases).toHaveLength(2);
      expect(result.totalPurchases).toBe(2);

      expect(result.purchases[0]).toEqual({
        saleId: 'sale-1',
        sessionId: 'session-456',
        seatNumbers: [1, 2],
        totalPriceInCents: 3000,
        purchasedAt: new Date('2024-01-01T10:00:00Z'),
      });

      expect(result.purchases[1]).toEqual({
        saleId: 'sale-2',
        sessionId: 'session-789',
        seatNumbers: [5],
        totalPriceInCents: 1500,
        purchasedAt: new Date('2024-01-02T14:30:00Z'),
      });
    });

    it('should return empty history for user with no purchases', async () => {
      const userId = 'user-without-purchases';

      mockSaleRepository.findByUserId.mockResolvedValue([]);

      const result = await useCase.execute(userId);

      expect(result.userId).toBe(userId);
      expect(result.purchases).toHaveLength(0);
      expect(result.totalPurchases).toBe(0);
    });

    it('should handle single purchase', async () => {
      const userId = 'user-single-purchase';

      const mockSale = {
        getId: () => 'sale-1',
        getSessionId: () => 'session-456',
        getSeatNumbers: () => [10],
        getTotalPrice: () => ({ getValue: () => 2000 }),
        getConfirmedAt: () => new Date('2024-01-01T12:00:00Z'),
      };

      mockSaleRepository.findByUserId.mockResolvedValue([mockSale]);

      const result = await useCase.execute(userId);

      expect(result.userId).toBe(userId);
      expect(result.purchases).toHaveLength(1);
      expect(result.totalPurchases).toBe(1);
      expect(result.purchases[0].saleId).toBe('sale-1');
    });
  });
});
