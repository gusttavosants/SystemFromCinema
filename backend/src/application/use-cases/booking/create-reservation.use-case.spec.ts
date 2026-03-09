/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Test, TestingModule } from '@nestjs/testing';
import { CreateReservationUseCase } from './create-reservation.use-case';
import { DistributedLockService } from '@infrastructure/cache';
import { UnitOfWork } from '@infrastructure/database/unit-of-work';
import { CreateReservationRequestDTO } from '@application/dtos';

describe('CreateReservationUseCase', () => {
  let useCase: CreateReservationUseCase;
  let mockDistributedLockService: any;
  let mockUnitOfWork: any;
  let mockSessionRepository: any;
  let mockSeatRepository: any;
  let mockReservationRepository: any;

  beforeEach(async () => {
    mockDistributedLockService = {
      executeWithLocks: jest.fn(),
    };

    mockUnitOfWork = {
      transactionPessimistic: jest.fn(),
    };

    mockSessionRepository = {
      findById: jest.fn(),
    };

    mockSeatRepository = {
      findWithPessimisticLock: jest.fn(),
      update: jest.fn(),
    };

    mockReservationRepository = {
      create: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateReservationUseCase,
        {
          provide: DistributedLockService,
          useValue: mockDistributedLockService,
        },
        {
          provide: UnitOfWork,
          useValue: mockUnitOfWork,
        },
        {
          provide: 'ISessionRepository',
          useValue: mockSessionRepository,
        },
        {
          provide: 'ISeatRepository',
          useValue: mockSeatRepository,
        },
        {
          provide: 'IReservationRepository',
          useValue: mockReservationRepository,
        },
      ],
    }).compile();

    useCase = module.get<CreateReservationUseCase>(CreateReservationUseCase);
  });

  describe('execute', () => {
    it('should acquire distributed locks for all seats', async () => {
      const input: CreateReservationRequestDTO = {
        sessionId: 'session-123',
        userId: 'user-456',
        seatNumbers: [1, 2, 3],
      };

      const mockSession = {
        getPrice: jest.fn().mockReturnValue({
          multiply: jest.fn().mockReturnValue({}),
        }),
      };

      const mockSeats = [
        {
          status: 'available',
          seatNumber: { getValue: () => 1 },
          updateStatus: jest.fn(),
        },
        {
          status: 'available',
          seatNumber: { getValue: () => 2 },
          updateStatus: jest.fn(),
        },
        {
          status: 'available',
          seatNumber: { getValue: () => 3 },
          updateStatus: jest.fn(),
        },
      ];

      mockSessionRepository.findById.mockResolvedValueOnce(mockSession);
      mockDistributedLockService.executeWithLocks.mockImplementationOnce(
        async (resources: any, callback: any) => {
          expect(resources).toEqual([
            'seat:session-123:1',
            'seat:session-123:2',
            'seat:session-123:3',
          ]);
          await callback();
        },
      );

      mockUnitOfWork.transactionPessimistic.mockImplementationOnce(
        async (callback: any) => {
          mockSeatRepository.findWithPessimisticLock.mockResolvedValueOnce(
            mockSeats,
          );
          await callback();
        },
      );

      mockReservationRepository.create.mockResolvedValueOnce(undefined);

      await useCase.execute(input);

      expect(mockDistributedLockService.executeWithLocks).toHaveBeenCalledWith(
        expect.arrayContaining([
          'seat:session-123:1',
          'seat:session-123:2',
          'seat:session-123:3',
        ]),
        expect.any(Function),
        {
          ttl: 30000,
          globalTimeoutMs: 6000,
        },
      );
    });

    it('should deduplicate seat numbers in lock resources', async () => {
      const input: CreateReservationRequestDTO = {
        sessionId: 'session-123',
        userId: 'user-456',
        seatNumbers: [1, 1, 2, 2, 3],
      };

      const mockSession = {
        getPrice: jest.fn().mockReturnValue({
          multiply: jest.fn().mockReturnValue({}),
        }),
      };

      mockSessionRepository.findById.mockResolvedValueOnce(mockSession);
      mockDistributedLockService.executeWithLocks.mockImplementationOnce(
        async (resources: any, callback: any) => {
          expect(resources).toHaveLength(3);
          await callback();
        },
      );

      mockUnitOfWork.transactionPessimistic.mockImplementationOnce(
        async (callback: any) => {
          mockSeatRepository.findWithPessimisticLock.mockResolvedValueOnce([]);
          await callback();
        },
      );

      mockReservationRepository.create.mockResolvedValueOnce(undefined);

      await useCase.execute(input);

      expect(mockDistributedLockService.executeWithLocks).toHaveBeenCalled();
    });

    it('should throw error if session not found', async () => {
      const input: CreateReservationRequestDTO = {
        sessionId: 'non-existent',
        userId: 'user-456',
        seatNumbers: [1],
      };

      mockSessionRepository.findById.mockResolvedValueOnce(null);

      await expect(useCase.execute(input)).rejects.toThrow(
        'Session with id non-existent not found',
      );

      expect(
        mockDistributedLockService.executeWithLocks,
      ).not.toHaveBeenCalled();
    });

    it('should use pessimistic locking within distributed lock', async () => {
      const input: CreateReservationRequestDTO = {
        sessionId: 'session-123',
        userId: 'user-456',
        seatNumbers: [1],
      };

      const mockSession = {
        getPrice: jest.fn().mockReturnValue({
          multiply: jest.fn().mockReturnValue({}),
        }),
      };

      const mockSeats = [
        {
          status: 'available',
          seatNumber: { getValue: () => 1 },
          updateStatus: jest.fn(),
        },
      ];

      mockSessionRepository.findById.mockResolvedValueOnce(mockSession);
      mockDistributedLockService.executeWithLocks.mockImplementationOnce(
        async (resources: any, callback: any) => {
          await callback();
        },
      );

      mockUnitOfWork.transactionPessimistic.mockImplementationOnce(
        async (callback: any) => {
          mockSeatRepository.findWithPessimisticLock.mockResolvedValueOnce(
            mockSeats,
          );
          await callback();
        },
      );

      mockReservationRepository.create.mockResolvedValueOnce(undefined);

      await useCase.execute(input);

      expect(mockUnitOfWork.transactionPessimistic).toHaveBeenCalled();
      expect(mockSeatRepository.findWithPessimisticLock).toHaveBeenCalledWith(
        'session-123',
        [1],
      );
    });
  });
});
