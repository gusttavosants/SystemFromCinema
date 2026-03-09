import { Module } from '@nestjs/common';

import { RedisService } from './redis.service';
import { DistributedLockService } from './distributed-lock.service';
import { CacheService } from './cache.service';

@Module({
  providers: [RedisService, DistributedLockService, CacheService],
  exports: [RedisService, DistributedLockService, CacheService],
})
export class RedisModule {}
