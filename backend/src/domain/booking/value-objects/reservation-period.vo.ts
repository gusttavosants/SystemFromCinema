export class ReservationPeriod {
  private readonly expirationTimeMs: number;

  private readonly createdAt: Date;

  private readonly expiresAt: Date;

  constructor(expirationTimeMs: number = 30000, createdAt: Date = new Date()) {
    if (!Number.isInteger(expirationTimeMs) || expirationTimeMs <= 0) {
      throw new Error(
        'Expiration time must be a positive integer in milliseconds',
      );
    }
    if (expirationTimeMs > 24 * 60 * 60 * 1000) {
      throw new Error('Expiration time cannot exceed 24 hours');
    }

    this.expirationTimeMs = expirationTimeMs;
    this.createdAt = new Date(createdAt);
    this.expiresAt = new Date(this.createdAt.getTime() + expirationTimeMs);
  }

  getExpirationTimeMs(): number {
    return this.expirationTimeMs;
  }

  getCreatedAt(): Date {
    return new Date(this.createdAt);
  }

  getExpiresAt(): Date {
    return new Date(this.expiresAt);
  }

  isExpired(now: Date = new Date()): boolean {
    return now > this.expiresAt;
  }

  getRemainingTimeMs(now: Date = new Date()): number {
    const remaining = this.expiresAt.getTime() - now.getTime();
    return remaining > 0 ? remaining : 0;
  }

  equals(other: ReservationPeriod): boolean {
    return (
      this.expirationTimeMs === other.expirationTimeMs &&
      this.createdAt.getTime() === other.createdAt.getTime()
    );
  }

  toString(): string {
    return `ReservationPeriod(expires in ${this.expirationTimeMs}ms)`;
  }
}
