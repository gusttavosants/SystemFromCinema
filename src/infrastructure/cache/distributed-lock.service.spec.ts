import { Test, TestingModule } from '@nestjs/testing';
import {
  DistributedLockService,
  type LockOptions,
} from './distributed-lock.service';
import { RedisService } from './redis.service';

describe('DistributedLockService', () => {
  let service: DistributedLockService;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let redisService: RedisService;
  let mockRedisClient: {
    set: jest.Mock;
    get: jest.Mock;
    del: jest.Mock;
    exists: jest.Mock;
    incr: jest.Mock;
    decr: jest.Mock;
    eval: jest.Mock;
    on: jest.Mock;
    disconnect: jest.Mock;
  };

  beforeEach(async () => {
    mockRedisClient = {
      set: jest.fn(),
      get: jest.fn(),
      del: jest.fn(),
      exists: jest.fn(),
      incr: jest.fn(),
      decr: jest.fn(),
      eval: jest.fn(),
      on: jest.fn(),
      disconnect: jest.fn(),
    };

    const mockRedisService = {
      getClient: jest.fn(() => mockRedisClient),
      set: jest.fn(),
      get: jest.fn(),
      delete: jest.fn(),
      exists: jest.fn(),
      incr: jest.fn(),
      decr: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DistributedLockService,
        { provide: RedisService, useValue: mockRedisService },
      ],
    }).compile();

    service = module.get<DistributedLockService>(DistributedLockService);
    redisService = module.get<RedisService>(RedisService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('acquireLock', () => {
    it('should successfully acquire a lock', async () => {
      mockRedisClient.set.mockResolvedValueOnce('OK');

      const result = await service.acquireLock('test-resource');

      expect(result).toBeTruthy();
      expect(mockRedisClient.set).toHaveBeenCalledWith(
        'lock:test-resource',
        expect.any(String),
        'PX',
        30000,
        'NX',
      );
    });

    it('should return null when lock acquisition fails after retries', async () => {
      mockRedisClient.set.mockResolvedValue(null);

      const result = await service.acquireLock('test-resource', {
        maxRetries: 1,
        initialDelayMs: 10,
      });

      expect(result).toBeNull();
      expect(mockRedisClient.set).toHaveBeenCalledTimes(2); // 1 initial + 1 retry
    });

    it('should respect custom TTL', async () => {
      mockRedisClient.set.mockResolvedValueOnce('OK');

      await service.acquireLock('test-resource', { ttl: 60000 });

      expect(mockRedisClient.set).toHaveBeenCalledWith(
        'lock:test-resource',
        expect.any(String),
        'PX',
        60000,
        'NX',
      );
    });

    it('should implement exponential backoff on retry', async () => {
      mockRedisClient.set
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce('OK');

      const startTime = Date.now();

      const result = await service.acquireLock('test-resource', {
        maxRetries: 2,
        initialDelayMs: 50,
        backoffMultiplier: 2,
      });

      const elapsed = Date.now() - startTime;

      // Should have at least: 50 + 100 = 150ms delay
      expect(elapsed).toBeGreaterThanOrEqual(150);
      expect(result).toBeTruthy();
      expect(mockRedisClient.set).toHaveBeenCalledTimes(3);
    });

    it('should handle Redis errors and retry', async () => {
      mockRedisClient.set
        .mockRejectedValueOnce(new Error('Redis error'))
        .mockResolvedValueOnce('OK');

      const result = await service.acquireLock('test-resource', {
        maxRetries: 1,
        initialDelayMs: 10,
      });

      expect(result).toBeTruthy();
      expect(mockRedisClient.set).toHaveBeenCalledTimes(2);
    });
  });

  describe('releaseLock', () => {
    it('should successfully release a lock with matching token', async () => {
      const token = 'test-token';
      mockRedisClient.eval.mockResolvedValueOnce(1);

      const result = await service.releaseLock('test-resource', token);

      expect(result).toBe(true);
      expect(mockRedisClient.eval).toHaveBeenCalledWith(
        expect.any(String),
        1,
        'lock:test-resource',
        token,
      );
    });

    it('should return false when token does not match', async () => {
      mockRedisClient.eval.mockResolvedValueOnce(0);

      const result = await service.releaseLock('test-resource', 'wrong-token');

      expect(result).toBe(false);
    });

    it('should handle Redis errors gracefully', async () => {
      mockRedisClient.eval.mockRejectedValueOnce(new Error('Redis error'));

      const result = await service.releaseLock('test-resource', 'token');

      expect(result).toBe(false);
    });

    it('should use Lua script for atomic operation', async () => {
      const token = 'test-token';
      mockRedisClient.eval.mockResolvedValueOnce(1);

      await service.releaseLock('test-resource', token);

      const luaScript = (
        mockRedisClient.eval.mock.calls[0] as unknown[]
      )[0] as string;
      expect(luaScript).toContain('redis.call("get"');
      expect(luaScript).toContain('redis.call("del"');
    });
  });

  describe('extendLock', () => {
    it('should successfully extend a lock with matching token', async () => {
      const token = 'test-token';
      mockRedisClient.eval.mockResolvedValueOnce(1);

      const result = await service.extendLock('test-resource', token, 60000);

      expect(result).toBe(true);
      expect(mockRedisClient.eval).toHaveBeenCalledWith(
        expect.any(String),
        1,
        'lock:test-resource',
        token,
        60000,
      );
    });

    it('should return false when token does not match', async () => {
      mockRedisClient.eval.mockResolvedValueOnce(0);

      const result = await service.extendLock(
        'test-resource',
        'wrong-token',
        60000,
      );

      expect(result).toBe(false);
    });

    it('should handle Redis errors gracefully', async () => {
      mockRedisClient.eval.mockRejectedValueOnce(new Error('Redis error'));

      const result = await service.extendLock('test-resource', 'token', 60000);

      expect(result).toBe(false);
    });

    it('should use Lua script for atomic operation', async () => {
      mockRedisClient.eval.mockResolvedValueOnce(1);

      await service.extendLock('test-resource', 'token', 60000);

      const luaScript = (
        mockRedisClient.eval.mock.calls[0] as unknown[]
      )[0] as string;
      expect(luaScript).toContain('redis.call("get"');
      expect(luaScript).toContain('redis.call("pexpire"');
    });
  });

  describe('executeWithLock', () => {
    it('should execute callback with lock acquired', async () => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const token = 'test-token';
      const callback = jest.fn().mockResolvedValueOnce('result');

      mockRedisClient.set.mockResolvedValueOnce('OK');
      mockRedisClient.eval.mockResolvedValueOnce(1);

      const result = await service.executeWithLock('test-resource', callback);

      expect(result).toBe('result');
      expect(callback).toHaveBeenCalled();
      expect(mockRedisClient.set).toHaveBeenCalled(); // acquire
      expect(mockRedisClient.eval).toHaveBeenCalled(); // release
    });

    it('should release lock even if callback throws', async () => {
      const callback = jest
        .fn()
        .mockRejectedValueOnce(new Error('callback error'));

      mockRedisClient.set.mockResolvedValueOnce('OK');
      mockRedisClient.eval.mockResolvedValueOnce(1);

      await expect(
        service.executeWithLock('test-resource', callback),
      ).rejects.toThrow('callback error');

      expect(mockRedisClient.eval).toHaveBeenCalled(); // release was called
    });

    it('should throw error if lock cannot be acquired', async () => {
      const callback = jest.fn();
      mockRedisClient.set.mockResolvedValue(null);

      await expect(
        service.executeWithLock('test-resource', callback, {
          maxRetries: 0,
        }),
      ).rejects.toThrow('Failed to acquire lock for resource: test-resource');

      expect(callback).not.toHaveBeenCalled();
    });

    it('should pass custom options to acquireLock', async () => {
      const callback = jest.fn().mockResolvedValueOnce('result');
      mockRedisClient.set.mockResolvedValueOnce('OK');
      mockRedisClient.eval.mockResolvedValueOnce(1);

      const options: LockOptions = {
        ttl: 60000,
        maxRetries: 5,
      };

      await service.executeWithLock('test-resource', callback, options);

      expect(mockRedisClient.set).toHaveBeenCalledWith(
        'lock:test-resource',
        expect.any(String),
        'PX',
        60000,
        'NX',
      );
    });
  });

  describe('acquireMultipleLocks', () => {
    it('should acquire locks in sorted order ensuring uniqueness', async () => {
      mockRedisClient.set.mockResolvedValue('OK');

      const result = await service.acquireMultipleLocks([
        'seat:session:2',
        'seat:session:1',
        'seat:session:1',
      ]);

      expect(result).toHaveLength(2);
      expect(result.map((lock) => lock.resource)).toEqual([
        'seat:session:1',
        'seat:session:2',
      ]);
      expect(mockRedisClient.set).toHaveBeenNthCalledWith(
        1,
        'lock:seat:session:1',
        expect.any(String),
        'PX',
        30000,
        'NX',
      );
      expect(mockRedisClient.set).toHaveBeenNthCalledWith(
        2,
        'lock:seat:session:2',
        expect.any(String),
        'PX',
        30000,
        'NX',
      );
    });

    it('should rollback already acquired locks if any acquisition fails', async () => {
      mockRedisClient.set
        .mockResolvedValueOnce('OK')
        .mockResolvedValueOnce(null);
      mockRedisClient.eval.mockResolvedValue(1);
      const releaseSpy = jest.spyOn(service, 'releaseLock');

      await expect(
        service.acquireMultipleLocks(['seat:session:2', 'seat:session:1']),
      ).rejects.toThrow('Failed to acquire lock for resource: seat:session:2');

      expect(releaseSpy).toHaveBeenCalledTimes(1);
      expect(releaseSpy).toHaveBeenCalledWith(
        'seat:session:1',
        expect.any(String),
      );

      releaseSpy.mockRestore();
    });
  });

  describe('executeWithLocks', () => {
    it('should release all locks even when callback throws', async () => {
      mockRedisClient.set.mockResolvedValue('OK');
      mockRedisClient.eval.mockResolvedValue(1);
      const callback = jest
        .fn()
        .mockRejectedValueOnce(new Error('callback failure'));

      await expect(
        service.executeWithLocks(
          ['seat:session:1', 'seat:session:2'],
          callback,
        ),
      ).rejects.toThrow('callback failure');

      expect(callback).toHaveBeenCalled();
      expect(mockRedisClient.eval).toHaveBeenCalledTimes(2);
    });
  });

  describe('edge cases', () => {
    it('should handle concurrent lock attempts', async () => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const token1 = 'token1';
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const token2 = null;

      mockRedisClient.set
        .mockResolvedValueOnce('OK')
        .mockResolvedValueOnce(null);

      const result1 = await service.acquireLock('resource');
      const result2 = await service.acquireLock('resource', {
        maxRetries: 0,
      });

      expect(result1).toBeTruthy();
      expect(result2).toBeNull();
    });

    it('should handle very large TTL values', async () => {
      mockRedisClient.set.mockResolvedValueOnce('OK');

      await service.acquireLock('test-resource', {
        ttl: Number.MAX_SAFE_INTEGER,
      });

      expect(mockRedisClient.set).toHaveBeenCalledWith(
        'lock:test-resource',
        expect.any(String),
        'PX',
        Number.MAX_SAFE_INTEGER,
        'NX',
      );
    });

    it('should generate unique tokens for each lock', async () => {
      mockRedisClient.set
        .mockResolvedValueOnce('OK')
        .mockResolvedValueOnce('OK');

      const token1 = await service.acquireLock('resource1');
      const token2 = await service.acquireLock('resource2');

      expect(token1).not.toBe(token2);
    });

    it('should handle special characters in resource names', async () => {
      mockRedisClient.set.mockResolvedValueOnce('OK');

      await service.acquireLock('resource:session:123:seat:456');

      expect(mockRedisClient.set).toHaveBeenCalledWith(
        'lock:resource:session:123:seat:456',
        expect.any(String),
        'PX',
        30000,
        'NX',
      );
    });
  });
});
