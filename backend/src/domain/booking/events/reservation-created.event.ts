export class ReservationCreatedEvent {
  public readonly aggregateId: string;

  public readonly occurredAt: Date;

  constructor(
    public readonly reservationId: string,
    public readonly sessionId: string,
    public readonly userId: string,
    public readonly seatNumbers: number[],
    public readonly totalPrice: number,
    public readonly expiresAt: Date,
  ) {
    this.aggregateId = reservationId;
    this.occurredAt = new Date();
  }

  getAggregateId(): string {
    return this.aggregateId;
  }

  getOccurredAt(): Date {
    return new Date(this.occurredAt);
  }

  getEventType(): string {
    return 'ReservationCreatedEvent';
  }
}
