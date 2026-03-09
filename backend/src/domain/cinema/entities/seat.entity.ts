import { v4 as uuidv4 } from 'uuid';

import { SeatNumber } from '../value-objects/seat-number.vo';

export type SeatStatus = 'available' | 'reserved' | 'sold';

export class Seat {
  readonly id: string;

  readonly sessionId: string;

  readonly seatNumber: SeatNumber;

  status: SeatStatus;

  private constructor(props: {
    id: string;
    sessionId: string;
    seatNumber: SeatNumber;
    status: SeatStatus;
  }) {
    this.id = props.id;
    this.sessionId = props.sessionId;
    this.seatNumber = props.seatNumber;
    this.status = props.status;
  }

  static create(props: {
    sessionId: string;
    seatNumber: number;
    status?: SeatStatus;
  }): Seat {
    const seatNumber = new SeatNumber(props.seatNumber);
    return new Seat({
      id: uuidv4(),
      sessionId: props.sessionId,
      seatNumber,
      status: props.status ?? 'available',
    });
  }

  static restore(props: {
    id: string;
    sessionId: string;
    seatNumber: SeatNumber;
    status: SeatStatus;
  }): Seat {
    return new Seat(props);
  }

  updateStatus(status: SeatStatus): void {
    this.status = status;
  }
}
