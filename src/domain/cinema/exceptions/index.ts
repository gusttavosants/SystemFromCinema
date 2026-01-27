import { HttpStatus } from '@nestjs/common';
import { CinemaException } from '@shared/filters/cinema-exception.filter';

export class SessionNotFoundException extends CinemaException {
  constructor(sessionId: string) {
    super(
      'SESSION_NOT_FOUND',
      `Session with id ${sessionId} not found`,
      HttpStatus.NOT_FOUND,
      { sessionId },
    );
  }
}

export class SeatNotAvailableException extends CinemaException {
  constructor(sessionId: string, seatNumbers: number[]) {
    super(
      'SEAT_NOT_AVAILABLE',
      `Seats ${seatNumbers.join(', ')} are not available in session ${sessionId}`,
      HttpStatus.CONFLICT,
      { sessionId, seatNumbers },
    );
  }
}

export class ReservationNotFoundException extends CinemaException {
  constructor(reservationId: string) {
    super(
      'RESERVATION_NOT_FOUND',
      `Reservation with id ${reservationId} not found`,
      HttpStatus.NOT_FOUND,
      { reservationId },
    );
  }
}

export class ReservationExpiredException extends CinemaException {
  constructor(reservationId: string) {
    super(
      'RESERVATION_EXPIRED',
      `Reservation ${reservationId} has expired`,
      HttpStatus.GONE,
      { reservationId },
    );
  }
}

export class ReservationCannotBeConfirmedException extends CinemaException {
  constructor(reservationId: string, reason: string) {
    super(
      'RESERVATION_CANNOT_BE_CONFIRMED',
      `Reservation ${reservationId} cannot be confirmed: ${reason}`,
      HttpStatus.UNPROCESSABLE_ENTITY,
      { reservationId, reason },
    );
  }
}

export class PaymentAmountMismatchException extends CinemaException {
  constructor(reservationId: string, expected: number, received: number) {
    super(
      'PAYMENT_AMOUNT_MISMATCH',
      `Payment amount mismatch for reservation ${reservationId}. Expected: ${expected}, Received: ${received}`,
      HttpStatus.BAD_REQUEST,
      { reservationId, expected, received },
    );
  }
}

export class UserNotFoundException extends CinemaException {
  constructor(userId: string) {
    super(
      'USER_NOT_FOUND',
      `User with id ${userId} not found`,
      HttpStatus.NOT_FOUND,
      { userId },
    );
  }
}

export class LockAcquisitionFailedException extends CinemaException {
  constructor(resource: string) {
    super(
      'LOCK_ACQUISITION_FAILED',
      `Failed to acquire lock for resource: ${resource}`,
      HttpStatus.CONFLICT,
      { resource },
    );
  }
}
