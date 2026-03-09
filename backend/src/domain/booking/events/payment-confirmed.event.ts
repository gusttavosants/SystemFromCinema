export class PaymentConfirmedEvent {
  public readonly aggregateId: string;

  public readonly occurredAt: Date;

  constructor(
    public readonly saleId: string,
    public readonly reservationId: string,
    public readonly sessionId: string,
    public readonly userId: string,
    public readonly seatNumbers: number[],
    public readonly totalPrice: number,
  ) {
    this.aggregateId = saleId;
    this.occurredAt = new Date();
  }

  getAggregateId(): string {
    return this.aggregateId;
  }

  getOccurredAt(): Date {
    return new Date(this.occurredAt);
  }

  getEventType(): string {
    return 'PaymentConfirmedEvent';
  }
}
