export class Sale {
  private readonly id: string;

  private readonly reservationId: string;

  private readonly sessionId: string;

  private readonly userId: string;

  private readonly seatNumbers: number[];

  private readonly totalPrice: number;

  private readonly paidAt: Date;

  private readonly createdAt: Date;

  private version: number = 0;

  constructor(
    id: string,
    reservationId: string,
    sessionId: string,
    userId: string,
    seatNumbers: number[],
    totalPrice: number,
    paidAt: Date = new Date(),
    createdAt: Date = new Date(),
    version: number = 0,
  ) {
    if (seatNumbers.length === 0) {
      throw new Error('At least one seat must be sold');
    }

    if (totalPrice <= 0) {
      throw new Error('Total price must be positive');
    }

    this.id = id;
    this.reservationId = reservationId;
    this.sessionId = sessionId;
    this.userId = userId;
    this.seatNumbers = seatNumbers;
    this.totalPrice = totalPrice;
    this.paidAt = paidAt;
    this.createdAt = createdAt;
    this.version = version;
  }

  getId(): string {
    return this.id;
  }

  getReservationId(): string {
    return this.reservationId;
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

  getPaidAt(): Date {
    return new Date(this.paidAt);
  }

  getCreatedAt(): Date {
    return new Date(this.createdAt);
  }

  getVersion(): number {
    return this.version;
  }

  static create(
    id: string,
    reservationId: string,
    sessionId: string,
    userId: string,
    seatNumbers: number[],
    totalPrice: number,
  ): Sale {
    return new Sale(
      id,
      reservationId,
      sessionId,
      userId,
      seatNumbers,
      totalPrice,
    );
  }

  static restore(
    id: string,
    reservationId: string,
    sessionId: string,
    userId: string,
    seatNumbers: number[],
    totalPrice: number,
    paidAt: Date,
    createdAt: Date,
    version: number,
  ): Sale {
    return new Sale(
      id,
      reservationId,
      sessionId,
      userId,
      seatNumbers,
      totalPrice,
      paidAt,
      createdAt,
      version,
    );
  }
}
