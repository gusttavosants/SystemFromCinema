import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';

interface CacheEntry {
  value: string;
  expiresAt?: number;
}

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private cache: Map<string, CacheEntry> = new Map();
  private cleanupInterval: NodeJS.Timeout;

  onModuleInit(): void {
    this.logger.log('In-Memory Cache initialized (Redis replacement)');

    this.cleanupInterval = setInterval(() => {
      this.cleanupExpiredKeys();
    }, 5000);
  }

  onModuleDestroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.cache.clear();
    this.logger.log('In-Memory Cache cleared');
  }

  private cleanupExpiredKeys(): void {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.expiresAt && entry.expiresAt <= now) {
        this.cache.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      this.logger.debug(`Cleaned ${cleaned} expired cache entries`);
    }
  }

  getClient(): any {
    return {
      set: async (key: string, value: string, ...args: any[]) => {
        let ttl: number | undefined;

        if (args[0] === 'PX' && typeof args[1] === 'number') {
          ttl = args[1];
        } else if (args[0] === 'EX' && typeof args[1] === 'number') {
          ttl = args[1] * 1000;
        }

        const isNX = args.includes('NX');

        if (isNX && this.cache.has(key)) {
          const entry = this.cache.get(key)!;
          if (!entry.expiresAt || entry.expiresAt > Date.now()) {
            return null;
          }
        }

        const entry: CacheEntry = {
          value,
          expiresAt: ttl ? Date.now() + ttl : undefined,
        };

        this.cache.set(key, entry);
        return 'OK';
      },
      get: async (key: string) => {
        const entry = this.cache.get(key);
        if (!entry) return null;

        if (entry.expiresAt && entry.expiresAt <= Date.now()) {
          this.cache.delete(key);
          return null;
        }

        return entry.value;
      },
      del: async (...keys: string[]) => {
        let deleted = 0;
        for (const key of keys) {
          if (this.cache.delete(key)) {
            deleted++;
          }
        }
        return deleted;
      },
      eval: async (script: string, numKeys: number, ...args: any[]) => {
        const keys = args.slice(0, numKeys);
        const argv = args.slice(numKeys);

        if (
          script.includes('redis.call("get"') &&
          script.includes('redis.call("del"')
        ) {
          const key = keys[0];
          const token = argv[0];
          const entry = this.cache.get(key);

          if (entry && entry.value === token) {
            this.cache.delete(key);
            return 1;
          }
          return 0;
        }

        return 0;
      },
    };
  }

  async set(key: string, value: string, ttl?: number): Promise<void> {
    const entry: CacheEntry = {
      value,
      expiresAt: ttl ? Date.now() + ttl * 1000 : undefined,
    };
    this.cache.set(key, entry);
  }

  async get(key: string): Promise<string | null> {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (entry.expiresAt && entry.expiresAt <= Date.now()) {
      this.cache.delete(key);
      return null;
    }

    return entry.value;
  }

  async delete(key: string): Promise<number> {
    return this.cache.delete(key) ? 1 : 0;
  }

  async exists(key: string): Promise<boolean> {
    const entry = this.cache.get(key);
    if (!entry) return false;

    if (entry.expiresAt && entry.expiresAt <= Date.now()) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  async incr(key: string): Promise<number> {
    const current = await this.get(key);
    const value = current ? parseInt(current, 10) + 1 : 1;
    await this.set(key, value.toString());
    return value;
  }

  async decr(key: string): Promise<number> {
    const current = await this.get(key);
    const value = current ? parseInt(current, 10) - 1 : -1;
    await this.set(key, value.toString());
    return value;
  }
}
