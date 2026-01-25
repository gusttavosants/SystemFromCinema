export class Reservation {
  private readonly id: string;

  private readonly sessionId: string;

  private readonly userId: string;

  private readonly seatNumbers: number[];

  private readonly totalPrice: number;

  private expiresAt: Date;

  private status: 'pending' | 'confirmed' | 'expired' | 'cancelled';

  private readonly createdAt: Date;

  private version: number = 0;

  constructor(
    id: string,
    sessionId: string,
    userId: string,
    seatNumbers: number[],
    totalPrice: number,
    expiresAt: Date,
    status: 'pending' | 'confirmed' | 'expired' | 'cancelled' = 'pending',
    createdAt: Date = new Date(),
    version: number = 0,
  ) {
    if (seatNumbers.length === 0) {
      throw new Error('At least one seat must be reserved');
    }

    if (totalPrice <= 0) {
      throw new Error('Total price must be positive');
    }

    if (expiresAt <= new Date()) {
      throw new Error('Expiration time must be in the future');
    }

    this.id = id;
    this.sessionId = sessionId;
    this.userId = userId;
    this.seatNumbers = seatNumbers;
    this.totalPrice = totalPrice;
    this.expiresAt = expiresAt;
    this.status = status;
    this.createdAt = createdAt;
    this.version = version;
  }

  getId(): string {
    return this.id;
  }

  getSessionId(): string {
    return this.sessionId;
  }

  getUserId(): string {
    return this.userId;
  }

  getSeatNumbers(): number[] {
    return [...this.seatNumbers];
  }

  getTotalPrice(): number {
    return this.totalPrice;
  }

  getExpiresAt(): Date {
    return new Date(this.expiresAt);
  }

  getStatus(): 'pending' | 'confirmed' | 'expired' | 'cancelled' {
    return this.status;
  }

  getCreatedAt(): Date {
    return new Date(this.createdAt);
  }

  getVersion(): number {
    return this.version;
  }

  isExpired(): boolean {
    return new Date() > this.expiresAt;
  }

  canBeConfirmed(): boolean {
    return this.status === 'pending' && !this.isExpired();
  }

  confirm(): void {
    if (!this.canBeConfirmed()) {
      if (this.isExpired()) {
        throw new Error('Cannot confirm expired reservation');
      }
      throw new Error('Reservation cannot be confirmed in current status');
    }
    this.status = 'confirmed';
  }

  markAsExpired(): void {
    if (this.status === 'pending') {
      this.status = 'expired';
    }
  }

  cancel(): void {
    if (this.status === 'confirmed') {
      throw new Error('Cannot cancel confirmed reservation');
    }
    this.status = 'cancelled';
  }

  static create(
    id: string,
    sessionId: string,
    userId: string,
    seatNumbers: number[],
    totalPrice: number,
    expirationTimeMs: number = 30000,
  ): Reservation {
    const expiresAt = new Date(Date.now() + expirationTimeMs);
    return new Reservation(
      id,
      sessionId,
      userId,
      seatNumbers,
      totalPrice,
      expiresAt,
      'pending',
      new Date(),
    );
  }

  static restore(
    id: string,
    sessionId: string,
    userId: string,
    seatNumbers: number[],
    totalPrice: number,
    expiresAt: Date,
    status: 'pending' | 'confirmed' | 'expired' | 'cancelled',
    createdAt: Date,
    version: number,
  ): Reservation {
    return new Reservation(
      id,
      sessionId,
      userId,
      seatNumbers,
      totalPrice,
      expiresAt,
      status,
      createdAt,
      version,
    );
  }
}
