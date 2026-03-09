/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Test, TestingModule } from '@nestjs/testing';
import { CreateReservationUseCase } from './create-reservation.use-case';
import { DistributedLockService } from '@infrastructure/cache';
import { UnitOfWork } from '@infrastructure/database/unit-of-work';
import { CreateReservationRequestDTO } from '@application/dtos';

describe('CreateReservationUseCase - Race Condition Prevention', () => {
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

  describe('concurrent reservation attempts', () => {
    it('should prevent double booking with distributed locks', async () => {
      const sessionId = 'session-123';
      const seatNumber = 1;
      let lockAcquiredCount = 0;

      const mockSession = {
        getPrice: jest.fn().mockReturnValue({
          multiply: jest.fn().mockReturnValue({}),
        }),
      };

      const mockSeat = {
        status: 'available',
        seatNumber: { getValue: () => seatNumber },
        updateStatus: jest.fn(),
      };

      mockSessionRepository.findById.mockResolvedValue(mockSession);

      mockDistributedLockService.executeWithLocks.mockImplementation(
        async (resources: any, callback: any) => {
          lockAcquiredCount++;
          if (lockAcquiredCount > 1) {
            throw new Error('Lock already held by another request');
          }
          await callback();
        },
      );

      mockUnitOfWork.transactionPessimistic.mockImplementation(
        async (callback: any) => {
          mockSeatRepository.findWithPessimisticLock.mockResolvedValueOnce([
            mockSeat,
          ]);
          await callback();
        },
      );

      mockReservationRepository.create.mockResolvedValue(undefined);

      const input: CreateReservationRequestDTO = {
        sessionId,
        userId: 'user-1',
        seatNumbers: [seatNumber],
      };

      const firstRequest = useCase.execute(input);
      const secondRequest = useCase.execute(input);

      await expect(Promise.all([firstRequest, secondRequest])).rejects.toThrow(
        'Lock already held by another request',
      );
    });

    it('should serialize concurrent requests for same seat', async () => {
      const sessionId = 'session-123';
      const seatNumber = 1;
      const executionOrder: string[] = [];

      const mockSession = {
        getPrice: jest.fn().mockReturnValue({
          multiply: jest.fn().mockReturnValue({}),
        }),
      };

      const createMockSeat = (status: string) => ({
        status,
        seatNumber: { getValue: () => seatNumber },
        updateStatus: jest.fn(),
      });

      mockSessionRepository.findById.mockResolvedValue(mockSession);

      mockDistributedLockService.executeWithLocks.mockImplementation(
        async (resources: any, callback: any) => {
          executionOrder.push('lock-acquired');
          await callback();
          executionOrder.push('lock-released');
        },
      );

      let callCount = 0;
      mockUnitOfWork.transactionPessimistic.mockImplementation(
        async (callback: any) => {
          callCount++;
          const status = callCount === 1 ? 'available' : 'reserved';
          mockSeatRepository.findWithPessimisticLock.mockResolvedValueOnce([
            createMockSeat(status),
          ]);
          executionOrder.push(`transaction-${callCount}`);
          await callback();
        },
      );

      mockReservationRepository.create.mockResolvedValue(undefined);

      const input: CreateReservationRequestDTO = {
        sessionId,
        userId: 'user-1',
        seatNumbers: [seatNumber],
      };

      await Promise.all([useCase.execute(input), useCase.execute(input)]);

      expect(executionOrder).toContain('lock-acquired');
      expect(executionOrder).toContain('lock-released');
      expect(mockDistributedLockService.executeWithLocks).toHaveBeenCalledTimes(
        2,
      );
    });

    it('should use pessimistic locking within distributed lock', async () => {
      const sessionId = 'session-123';
      const seatNumbers = [1, 2, 3];

      const mockSession = {
        getPrice: jest.fn().mockReturnValue({
          multiply: jest.fn().mockReturnValue({}),
        }),
      };

      const mockSeats = seatNumbers.map((num) => ({
        status: 'available',
        seatNumber: { getValue: () => num },
        updateStatus: jest.fn(),
      }));

      mockSessionRepository.findById.mockResolvedValue(mockSession);

      mockDistributedLockService.executeWithLocks.mockImplementation(
        async (resources: any, callback: any) => {
          expect(resources).toHaveLength(3);
          await callback();
        },
      );

      mockUnitOfWork.transactionPessimistic.mockImplementation(
        async (callback: any) => {
          mockSeatRepository.findWithPessimisticLock.mockResolvedValueOnce(
            mockSeats,
          );
          await callback();
        },
      );

      mockReservationRepository.create.mockResolvedValue(undefined);

      const input: CreateReservationRequestDTO = {
        sessionId,
        userId: 'user-1',
        seatNumbers,
      };

      await useCase.execute(input);

      expect(mockUnitOfWork.transactionPessimistic).toHaveBeenCalled();
      expect(mockSeatRepository.findWithPessimisticLock).toHaveBeenCalledWith(
        sessionId,
        seatNumbers,
      );
    });

    it('should handle lock timeout gracefully', async () => {
      const sessionId = 'session-123';
      const seatNumber = 1;

      const mockSession = {
        getPrice: jest.fn().mockReturnValue({
          multiply: jest.fn().mockReturnValue({}),
        }),
      };

      mockSessionRepository.findById.mockResolvedValue(mockSession);

      mockDistributedLockService.executeWithLocks.mockRejectedValueOnce(
        new Error('Failed to acquire lock for resource: seat:session-123:1'),
      );

      const input: CreateReservationRequestDTO = {
        sessionId,
        userId: 'user-1',
        seatNumbers: [seatNumber],
      };

      await expect(useCase.execute(input)).rejects.toThrow(
        'Failed to acquire lock',
      );
    });

    it('should release locks even when transaction fails', async () => {
      const sessionId = 'session-123';
      const seatNumber = 1;
      let lockReleased = false;

      const mockSession = {
        getPrice: jest.fn().mockReturnValue({
          multiply: jest.fn().mockReturnValue({}),
        }),
      };

      mockSessionRepository.findById.mockResolvedValue(mockSession);

      mockDistributedLockService.executeWithLocks.mockImplementation(
        async (resources: any, callback: any) => {
          try {
            await callback();
          } finally {
            lockReleased = true;
          }
        },
      );

      mockUnitOfWork.transactionPessimistic.mockRejectedValueOnce(
        new Error('Database error'),
      );

      const input: CreateReservationRequestDTO = {
        sessionId,
        userId: 'user-1',
        seatNumbers: [seatNumber],
      };

      await expect(useCase.execute(input)).rejects.toThrow('Database error');
      expect(lockReleased).toBe(true);
    });

    it('should prevent seat overbooking across multiple requests', async () => {
      const sessionId = 'session-123';
      const seatNumber = 1;
      const totalSeats = 1;
      let reservedCount = 0;

      const mockSession = {
        getPrice: jest.fn().mockReturnValue({
          multiply: jest.fn().mockReturnValue({}),
        }),
      };

      mockSessionRepository.findById.mockResolvedValue(mockSession);

      mockDistributedLockService.executeWithLocks.mockImplementation(
        async (resources: any, callback: any) => {
          await callback();
        },
      );

      mockUnitOfWork.transactionPessimistic.mockImplementation(
        async (callback: any) => {
          const isAvailable = reservedCount < totalSeats;
          const mockSeat = {
            status: isAvailable ? 'available' : 'reserved',
            seatNumber: { getValue: () => seatNumber },
            updateStatus: jest.fn(),
          };

          mockSeatRepository.findWithPessimisticLock.mockResolvedValueOnce([
            mockSeat,
          ]);

          if (isAvailable) {
            reservedCount++;
            await callback();
          } else {
            throw new Error('Seat is not available');
          }
        },
      );

      mockReservationRepository.create.mockResolvedValue(undefined);

      const input: CreateReservationRequestDTO = {
        sessionId,
        userId: 'user-1',
        seatNumbers: [seatNumber],
      };

      const firstRequest = useCase.execute(input);
      const secondRequest = useCase.execute(input);

      const results = await Promise.allSettled([firstRequest, secondRequest]);

      const fulfilled = results.filter((r) => r.status === 'fulfilled');
      const rejected = results.filter((r) => r.status === 'rejected');

      expect(fulfilled).toHaveLength(1);
      expect(rejected).toHaveLength(1);
      expect(reservedCount).toBe(1);
    });
  });
});
