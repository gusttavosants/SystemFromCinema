/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Test, TestingModule } from '@nestjs/testing';
import { GetSessionAvailabilityUseCase } from './get-session-availability.use-case';
import { RedisService } from '@infrastructure/cache';

describe('GetSessionAvailabilityUseCase', () => {
  let useCase: GetSessionAvailabilityUseCase;
  let mockSessionRepository: any;
  let mockSeatRepository: any;
  let mockReservationRepository: any;
  let mockRedisService: any;

  beforeEach(async () => {
    mockSessionRepository = {
      findById: jest.fn(),
    };

    mockSeatRepository = {
      findBySessionId: jest.fn(),
    };

    mockReservationRepository = {
      findPendingReservationsBySession: jest.fn(),
    };

    mockRedisService = {
      get: jest.fn(),
      set: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetSessionAvailabilityUseCase,
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
        {
          provide: RedisService,
          useValue: mockRedisService,
        },
      ],
    }).compile();

    useCase = module.get<GetSessionAvailabilityUseCase>(
      GetSessionAvailabilityUseCase,
    );
  });

  describe('execute', () => {
    it('should return cached availability if available', async () => {
      const sessionId = 'session-123';
      const cachedData = {
        sessionId,
        totalSeats: 100,
        availableSeats: [{ seatNumber: 1, status: 'available' }],
        reservedSeats: [],
        soldSeats: [],
        lastUpdated: new Date(),
      };

      mockRedisService.get.mockResolvedValue(JSON.stringify(cachedData));

      const result = await useCase.execute(sessionId);

      expect(result).toEqual(cachedData);
      expect(mockRedisService.get).toHaveBeenCalledWith(
        `session:availability:${sessionId}`,
      );
      expect(mockSessionRepository.findById).not.toHaveBeenCalled();
    });

    it('should calculate availability when cache is empty', async () => {
      const sessionId = 'session-123';

      const mockSession = { getId: () => sessionId };
      const mockSeats = [
        {
          getSeatNumber: () => ({ getValue: () => 1 }),
          getStatus: () => 'available',
        },
        {
          getSeatNumber: () => ({ getValue: () => 2 }),
          getStatus: () => 'reserved',
        },
        {
          getSeatNumber: () => ({ getValue: () => 3 }),
          getStatus: () => 'sold',
        },
      ];

      const mockReservations = [
        {
          getSeatNumbers: () => [2],
          getId: () => 'res-1',
        },
      ];

      mockRedisService.get.mockResolvedValue(null);
      mockSessionRepository.findById.mockResolvedValue(mockSession);
      mockSeatRepository.findBySessionId.mockResolvedValue(mockSeats);
      mockReservationRepository.findPendingReservationsBySession.mockResolvedValue(
        mockReservations,
      );
      mockRedisService.set.mockResolvedValue(undefined);

      const result = await useCase.execute(sessionId);

      expect(result.sessionId).toBe(sessionId);
      expect(result.totalSeats).toBe(3);
      expect(result.availableSeats).toHaveLength(1);
      expect(result.availableSeats[0].seatNumber).toBe(1);
      expect(result.reservedSeats).toHaveLength(1);
      expect(result.reservedSeats[0].seatNumber).toBe(2);
      expect(result.soldSeats).toHaveLength(1);
      expect(result.soldSeats[0].seatNumber).toBe(3);

      expect(mockRedisService.set).toHaveBeenCalledWith(
        `session:availability:${sessionId}`,
        expect.any(String),
        30,
      );
    });

    it('should throw error if session not found', async () => {
      const sessionId = 'non-existent';

      mockRedisService.get.mockResolvedValue(null);
      mockSessionRepository.findById.mockResolvedValue(null);

      await expect(useCase.execute(sessionId)).rejects.toThrow(
        'Session with id non-existent not found',
      );
    });

    it('should handle multiple reservations on same seat', async () => {
      const sessionId = 'session-123';

      const mockSession = { getId: () => sessionId };
      const mockSeats = [
        {
          getSeatNumber: () => ({ getValue: () => 1 }),
          getStatus: () => 'available',
        },
      ];

      const mockReservations = [
        { getSeatNumbers: () => [1], getId: () => 'res-1' },
        { getSeatNumbers: () => [1], getId: () => 'res-2' }, // Another reservation for same seat
      ];

      mockRedisService.get.mockResolvedValue(null);
      mockSessionRepository.findById.mockResolvedValue(mockSession);
      mockSeatRepository.findBySessionId.mockResolvedValue(mockSeats);
      mockReservationRepository.findPendingReservationsBySession.mockResolvedValue(
        mockReservations,
      );

      const result = await useCase.execute(sessionId);

      expect(result.availableSeats).toHaveLength(0);
      expect(result.reservedSeats).toHaveLength(1);
      expect(result.reservedSeats[0].seatNumber).toBe(1);
    });
  });
});
