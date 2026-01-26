import { Injectable, Logger } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';

import { RedisService } from './redis.service';

export interface LockOptions {
  ttl?: number;
  maxRetries?: number;
  initialDelayMs?: number;
  backoffMultiplier?: number;
}

export interface MultiLockOptions extends LockOptions {
  globalTimeoutMs?: number;
}

interface AcquiredLock {
  resource: string;
  token: string;
}

@Injectable()
export class DistributedLockService {
  private readonly logger = new Logger(DistributedLockService.name);
  private readonly defaultTtl = 30000; // 30 segundos
  private readonly defaultMaxRetries = 3;
  private readonly defaultInitialDelayMs = 50;
  private readonly defaultBackoffMultiplier = 2;
  private readonly defaultGlobalTimeoutMs = 8000;

  constructor(private readonly redisService: RedisService) {}

  /**
   * Adquire um lock distribuído usando Redlock algorithm
   * Retorna um token único que deve ser usado para liberar o lock
   */
  async acquireLock(
    resource: string,
    options: LockOptions = {},
    deadlineAt?: number,
  ): Promise<string | null> {
    const ttl = options.ttl || this.defaultTtl;
    const maxRetries = options.maxRetries || this.defaultMaxRetries;
    const initialDelayMs = options.initialDelayMs || this.defaultInitialDelayMs;
    const backoffMultiplier =
      options.backoffMultiplier || this.defaultBackoffMultiplier;

    const lockToken = uuidv4();
    const lockKey = `lock:${resource}`;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      if (deadlineAt && Date.now() >= deadlineAt) {
        this.logger.warn(
          `Deadline reached before acquiring lock ${lockKey} (attempt ${attempt + 1})`,
        );
        return null;
      }

      try {
        // Tentar adquirir o lock (SET NX EX)
        const result = await this.redisService
          .getClient()
          .set(lockKey, lockToken, 'PX', ttl, 'NX');

        if (result === 'OK') {
          this.logger.debug(
            `Lock acquired: ${lockKey} with token ${lockToken}`,
          );
          return lockToken;
        }

        // Lock não foi adquirido, fazer retry com exponential backoff
        if (attempt < maxRetries) {
          const delayMs = initialDelayMs * Math.pow(backoffMultiplier, attempt);
          this.logger.debug(
            `Lock acquisition failed (attempt ${attempt + 1}/${maxRetries + 1}), retrying in ${delayMs}ms`,
          );
          await this.delayRespectingDeadline(delayMs, deadlineAt);
        }
      } catch (error) {
        this.logger.error(
          `Error acquiring lock ${lockKey}: ${error instanceof Error ? error.message : String(error)}`,
        );
        if (attempt < maxRetries) {
          const delayMs = initialDelayMs * Math.pow(backoffMultiplier, attempt);
          await this.delayRespectingDeadline(delayMs, deadlineAt);
        }
      }
    }

    this.logger.warn(
      `Failed to acquire lock ${lockKey} after ${maxRetries + 1} attempts`,
    );
    return null;
  }

  /**
   * Libera um lock distribuído
   * Verifica o token antes de liberar (segurança contra liberação acidental)
   */
  async releaseLock(resource: string, lockToken: string): Promise<boolean> {
    const lockKey = `lock:${resource}`;

    try {
      // Script Lua para remover lock atomicamente apenas se o token bate
      const script = `
        if redis.call("get", KEYS[1]) == ARGV[1] then
          return redis.call("del", KEYS[1])
        else
          return 0
        end
      `;

      const result = await this.redisService
        .getClient()
        .eval(script, 1, lockKey, lockToken);

      if (result === 1) {
        this.logger.debug(`Lock released: ${lockKey}`);
        return true;
      }

      this.logger.warn(
        `Lock token mismatch for ${lockKey} - possible lock expiration`,
      );
      return false;
    } catch (error) {
      this.logger.error(
        `Error releasing lock ${lockKey}: ${error instanceof Error ? error.message : String(error)}`,
      );
      return false;
    }
  }

  /**
   * Estende a duração de um lock existente
   * Útil para operações que demoram mais que o TTL inicial
   */
  async extendLock(
    resource: string,
    lockToken: string,
    additionalTtlMs: number,
  ): Promise<boolean> {
    const lockKey = `lock:${resource}`;

    try {
      // Script Lua para estender TTL atomicamente apenas se o token bate
      const script = `
        if redis.call("get", KEYS[1]) == ARGV[1] then
          return redis.call("pexpire", KEYS[1], ARGV[2])
        else
          return 0
        end
      `;

      const result = await this.redisService
        .getClient()
        .eval(script, 1, lockKey, lockToken, additionalTtlMs);

      if (result === 1) {
        this.logger.debug(
          `Lock extended: ${lockKey} with additional ${additionalTtlMs}ms`,
        );
        return true;
      }

      this.logger.warn(
        `Cannot extend lock ${lockKey} - token mismatch or lock expired`,
      );
      return false;
    } catch (error) {
      this.logger.error(
        `Error extending lock ${lockKey}: ${error instanceof Error ? error.message : String(error)}`,
      );
      return false;
    }
  }

  /**
   * Executa função com lock automático
   * Garante que lock é sempre liberado (mesmo em caso de erro)
   */
  async executeWithLock<T>(
    resource: string,
    callback: () => Promise<T>,
    options: LockOptions = {},
  ): Promise<T> {
    const lockToken = await this.acquireLock(resource, options);

    if (!lockToken) {
      throw new Error(`Failed to acquire lock for resource: ${resource}`);
    }

    try {
      return await callback();
    } finally {
      await this.releaseLock(resource, lockToken);
    }
  }

  async acquireMultipleLocks(
    resources: string[],
    options: MultiLockOptions = {},
  ): Promise<AcquiredLock[]> {
    if (resources.length === 0) {
      return [];
    }

    const uniqueResources = Array.from(new Set(resources)).sort();
    const deadlineAt =
      Date.now() + (options.globalTimeoutMs ?? this.defaultGlobalTimeoutMs);
    const acquired: AcquiredLock[] = [];

    for (const resource of uniqueResources) {
      const token = await this.acquireLock(resource, options, deadlineAt);

      if (!token) {
        await this.releaseAcquiredLocks(acquired);
        throw new Error(`Failed to acquire lock for resource: ${resource}`);
      }

      acquired.push({ resource, token });
    }

    return acquired;
  }

  async executeWithLocks<T>(
    resources: string[],
    callback: () => Promise<T>,
    options: MultiLockOptions = {},
  ): Promise<T> {
    const acquiredLocks = await this.acquireMultipleLocks(resources, options);

    try {
      return await callback();
    } finally {
      await this.releaseAcquiredLocks(acquiredLocks);
    }
  }

  /**
   * Helper para delay (exponential backoff)
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private async delayRespectingDeadline(
    requestedDelayMs: number,
    deadlineAt?: number,
  ): Promise<void> {
    if (!deadlineAt) {
      await this.delay(requestedDelayMs);
      return;
    }

    const remainingMs = deadlineAt - Date.now();

    if (remainingMs <= 0) {
      return;
    }

    await this.delay(Math.min(requestedDelayMs, remainingMs));
  }

  private async releaseAcquiredLocks(
    acquiredLocks: AcquiredLock[],
  ): Promise<void> {
    for (const { resource, token } of [...acquiredLocks].reverse()) {
      await this.releaseLock(resource, token);
    }
  }
}
