import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

@Injectable()
export class CacheService {
  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  async get<T>(key: string): Promise<T | undefined> {
    return this.cacheManager.get<T>(key);
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    await this.cacheManager.set(key, value, ttl);
  }

  async del(key: string): Promise<void> {
    await this.cacheManager.del(key);
  }

  async reset(): Promise<void> {
    await this.cacheManager.reset();
  }

  // User-specific cache methods
  getUserCacheKey(userId: string): string {
    return `user:${userId}`;
  }

  async getUser(userId: string) {
    return this.get(this.getUserCacheKey(userId));
  }

  async setUser(userId: string, userData: any, ttl = 3600000): Promise<void> {
    await this.set(this.getUserCacheKey(userId), userData, ttl);
  }

  async invalidateUser(userId: string): Promise<void> {
    await this.del(this.getUserCacheKey(userId));
  }

  // Session-specific cache methods
  getSessionCacheKey(sessionId: string): string {
    return `session:${sessionId}`;
  }

  async getSession(sessionId: string) {
    return this.get(this.getSessionCacheKey(sessionId));
  }

  async setSession(
    sessionId: string,
    sessionData: any,
    ttl = 1800000,
  ): Promise<void> {
    await this.set(this.getSessionCacheKey(sessionId), sessionData, ttl);
  }

  async invalidateSession(sessionId: string): Promise<void> {
    await this.del(this.getSessionCacheKey(sessionId));
  }

  // Session availability cache methods
  getSessionAvailabilityCacheKey(sessionId: string): string {
    return `session_availability:${sessionId}`;
  }

  async getSessionAvailability(sessionId: string) {
    return this.get(this.getSessionAvailabilityCacheKey(sessionId));
  }

  async setSessionAvailability(
    sessionId: string,
    availabilityData: any,
    ttl = 300000,
  ): Promise<void> {
    await this.set(
      this.getSessionAvailabilityCacheKey(sessionId),
      availabilityData,
      ttl,
    );
  }

  async invalidateSessionAvailability(sessionId: string): Promise<void> {
    await this.del(this.getSessionAvailabilityCacheKey(sessionId));
  }
}
