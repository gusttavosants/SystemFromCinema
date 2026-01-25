import { v4 as uuidv4 } from 'uuid';

import { Price } from '@domain/cinema/value-objects/price.vo';

export class Sale {
  private readonly id: string;

  private readonly reservationId: string;

  private readonly sessionId: string;

  private readonly userId: string;

  private readonly seatNumbers: number[];

  private readonly totalPrice: Price;

  private readonly confirmedAt: Date;

  private readonly createdAt: Date;

  private version: number = 0;

  constructor(
    id: string,
    reservationId: string,
    sessionId: string,
    userId: string,
    seatNumbers: number[],
    totalPrice: Price,
    confirmedAt: Date = new Date(),
    createdAt: Date = new Date(),
    version: number = 0,
  ) {
    if (seatNumbers.length === 0) {
      throw new Error('At least one seat must be sold');
    }

    this.id = id;
    this.reservationId = reservationId;
    this.sessionId = sessionId;
    this.userId = userId;
    this.seatNumbers = seatNumbers;
    this.totalPrice = totalPrice;
    this.confirmedAt = confirmedAt;
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

  getTotalPrice(): Price {
    return this.totalPrice;
  }

  getConfirmedAt(): Date {
    return new Date(this.confirmedAt);
  }

  getCreatedAt(): Date {
    return new Date(this.createdAt);
  }

  getVersion(): number {
    return this.version;
  }

  static create(props: {
    reservationId: string;
    sessionId: string;
    userId: string;
    seatNumbers: number[];
    totalPrice: Price;
  }): Sale {
    return new Sale(
      uuidv4(),
      props.reservationId,
      props.sessionId,
      props.userId,
      props.seatNumbers,
      props.totalPrice,
    );
  }

  static restore(
    id: string,
    reservationId: string,
    sessionId: string,
    userId: string,
    seatNumbers: number[],
    totalPrice: Price,
    confirmedAt: Date,
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
      confirmedAt,
      createdAt,
      version,
    );
  }
}
