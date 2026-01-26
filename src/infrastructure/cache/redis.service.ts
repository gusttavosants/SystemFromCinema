import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private redis: Redis;

  onModuleInit(): void {
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379', 10),
      password: process.env.REDIS_PASSWORD,
      retryStrategy: (times: number) => {
        const delay = Math.min(times * 50, 2000);
        this.logger.warn(
          `Redis connection retry attempt ${times}, delay: ${delay}ms`,
        );
        return delay;
      },
      maxRetriesPerRequest: null,
    });

    this.redis.on('connect', () => {
      this.logger.log('Redis connected successfully');
    });

    this.redis.on('error', (error: Error) => {
      this.logger.error(`Redis connection error: ${error.message}`);
    });
  }

  onModuleDestroy(): void {
    if (this.redis) {
      this.redis.disconnect();
      this.logger.log('Redis disconnected');
    }
  }

  getClient(): Redis {
    return this.redis;
  }

  async set(key: string, value: string, ttl?: number): Promise<void> {
    if (ttl) {
      await this.redis.setex(key, ttl, value);
    } else {
      await this.redis.set(key, value);
    }
  }

  async get(key: string): Promise<string | null> {
    return this.redis.get(key);
  }

  async delete(key: string): Promise<number> {
    return this.redis.del(key);
  }

  async exists(key: string): Promise<boolean> {
    const result = await this.redis.exists(key);
    return result === 1;
  }

  async incr(key: string): Promise<number> {
    return this.redis.incr(key);
  }

  async decr(key: string): Promise<number> {
    return this.redis.decr(key);
  }
}
