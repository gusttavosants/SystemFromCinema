export class Price {
  private readonly value: number;

  constructor(value: number) {
    if (typeof value !== 'number' || value <= 0 || !isFinite(value)) {
      throw new Error('Price must be a positive number');
    }
    if (value > 1000000) {
      throw new Error('Price cannot exceed 1,000,000');
    }
    this.value = Math.round(value * 100) / 100; // 2 decimal places
  }

  getValue(): number {
    return this.value;
  }

  equals(other: Price): boolean {
    return this.value === other.value;
  }

  add(other: Price): Price {
    return new Price(this.value + other.value);
  }

  multiply(quantity: number): Price {
    if (!Number.isInteger(quantity) || quantity < 0) {
      throw new Error('Quantity must be a non-negative integer');
    }
    return new Price(this.value * quantity);
  }

  toString(): string {
    return `$${this.value.toFixed(2)}`;
  }
}
