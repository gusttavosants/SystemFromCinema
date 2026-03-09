export class ReservationExpiredEvent {
  public readonly aggregateId: string;

  public readonly occurredAt: Date;

  constructor(
    public readonly reservationId: string,
    public readonly sessionId: string,
    public readonly seatNumbers: number[],
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
    return 'ReservationExpiredEvent';
  }
}
