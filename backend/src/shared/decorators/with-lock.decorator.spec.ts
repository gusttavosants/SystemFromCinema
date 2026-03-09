/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */

/* eslint-disable @typescript-eslint/require-await */
import { WithLock, WITH_LOCK_METADATA } from './with-lock.decorator';
import { Reflector } from '@nestjs/core';

describe('WithLock Decorator', () => {
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
  });

  it('should apply metadata to method', () => {
    class TestService {
      @WithLock('test:resource', { ttl: 5000 })
      testMethod(this: void): Promise<void> {
        return Promise.resolve();
      }
    }

    const metadata = reflector.get(
      WITH_LOCK_METADATA,
      TestService.prototype.testMethod,
    );
    expect(metadata).toBeDefined();
    expect(metadata.resourceTemplate).toBe('test:resource');
    expect(metadata.options.ttl).toBe(5000);
  });

  it('should replace single template variable', async () => {
    const mockLockService = {
      executeWithLock: jest.fn().mockResolvedValue('result'),
    };

    class TestService {
      distributedLockService = mockLockService;

      @WithLock('reservation:{{sessionId}}')
      async createReservation(sessionId: string): Promise<string> {
        return `success-${sessionId}`;
      }
    }

    const service = new TestService();
    await service.createReservation('session-123');

    expect(mockLockService.executeWithLock).toHaveBeenCalledWith(
      'reservation:session-123',
      expect.any(Function),
      {},
    );
  });

  it('should replace multiple template variables', async () => {
    const mockLockService = {
      executeWithLock: jest.fn().mockResolvedValue('result'),
    };

    class TestService {
      distributedLockService = mockLockService;

      @WithLock('seat:{{sessionId}}:{{seatNumber}}')
      async reserveSeat(
        sessionId: string,
        seatNumber: number,
      ): Promise<string> {
        return `success-${sessionId}-${seatNumber}`;
      }
    }

    const service = new TestService();
    await service.reserveSeat('session-123', 42);

    expect(mockLockService.executeWithLock).toHaveBeenCalledWith(
      'seat:session-123:42',
      expect.any(Function),
      {},
    );
  });

  it('should execute callback within lock', async () => {
    const mockLockService = {
      executeWithLock: jest.fn(
        async (resource: string, callback: () => Promise<string>) => {
          return callback();
        },
      ),
    };

    class TestService {
      distributedLockService = mockLockService;

      @WithLock('test:resource')
      async testMethod(): Promise<string> {
        return 'result';
      }
    }

    const service = new TestService();
    const result = await service.testMethod();

    expect(result).toBe('result');
    expect(mockLockService.executeWithLock).toHaveBeenCalled();
  });

  it('should pass lock options to executeWithLock', async () => {
    const lockOptions = {
      ttl: 30000,
      maxRetries: 5,
      initialDelayMs: 100,
    };

    const mockLockService = {
      executeWithLock: jest.fn().mockResolvedValue('result'),
    };

    class TestService {
      distributedLockService = mockLockService;

      @WithLock('test:resource', lockOptions)
      async testMethod(): Promise<string> {
        return 'success';
      }
    }

    const service = new TestService();
    await service.testMethod();

    expect(mockLockService.executeWithLock).toHaveBeenCalledWith(
      'test:resource',
      expect.any(Function),
      lockOptions,
    );
  });

  it('should throw error if DistributedLockService not found', async () => {
    class TestService {
      @WithLock('test:resource')
      async testMethod(): Promise<string> {
        return Promise.resolve('success');
      }
    }

    const service = new TestService();

    await expect(service.testMethod()).rejects.toThrow(
      'DistributedLockService not found',
    );
  });

  it('should throw error if template variable not found', async () => {
    const mockLockService = {
      executeWithLock: jest.fn(
        async (resource: string, callback: () => Promise<string>) => {
          return callback();
        },
      ),
    };

    class TestService {
      distributedLockService = mockLockService;

      @WithLock('reservation:{{sessionId}}:{{userId}}')
      async createReservation(sessionId: string): Promise<string> {
        return `success-${sessionId}`;
      }
    }

    const service = new TestService();

    await expect(service.createReservation('session-123')).rejects.toThrow(
      'Template variable userId not found',
    );
  });

  it('should preserve method return value', async () => {
    const mockLockService = {
      executeWithLock: jest.fn(
        async (
          resource: string,
          callback: () => Promise<{ id: string; name: string }>,
        ) => {
          return callback();
        },
      ),
    };

    class TestService {
      distributedLockService = mockLockService;

      @WithLock('test:resource')
      async testMethod(): Promise<{ id: string; name: string }> {
        return { id: '123', name: 'test' };
      }
    }

    const service = new TestService();
    const result = await service.testMethod();

    expect(result).toEqual({ id: '123', name: 'test' });
  });
});
