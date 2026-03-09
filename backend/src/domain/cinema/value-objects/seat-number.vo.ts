export class SeatNumber {
  private readonly value: number;

  constructor(value: number) {
    if (!Number.isInteger(value) || value < 1 || value > 999) {
      throw new Error('Seat number must be an integer between 1 and 999');
    }
    this.value = value;
  }

  getValue(): number {
    return this.value;
  }

  equals(other: SeatNumber): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return `Seat ${this.value}`;
  }
}
