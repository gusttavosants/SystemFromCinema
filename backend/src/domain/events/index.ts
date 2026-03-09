/**
 * Eventos de Reserva
 */
export interface ReservationCreatedEvent {
  reservationId: string;
  sessionId: string;
  userId: string;
  seatNumber: number;
  quantity: number;
  totalPrice: number;
  timestamp: Date;
}

export interface ReservationCancelledEvent {
  reservationId: string;
  sessionId: string;
  userId: string;
  reason: string;
  timestamp: Date;
}

/**
 * Eventos de Pagamento
 */
export interface PaymentConfirmedEvent {
  paymentId: string;
  reservationId: string;
  amount: number;
  method: string;
  timestamp: Date;
}

export interface PaymentFailedEvent {
  paymentId: string;
  reservationId: string;
  reason: string;
  timestamp: Date;
}

/**
 * Eventos de Sessão
 */
export interface SessionCreatedEvent {
  sessionId: string;
  movieId: string;
  startTime: Date;
  availableSeats: number;
  timestamp: Date;
}

export interface SessionSoldOutEvent {
  sessionId: string;
  movieId: string;
  timestamp: Date;
}

/**
 * Union type de todos os eventos
 */
export type DomainEvent =
  | ReservationCreatedEvent
  | ReservationCancelledEvent
  | PaymentConfirmedEvent
  | PaymentFailedEvent
  | SessionCreatedEvent
  | SessionSoldOutEvent;
