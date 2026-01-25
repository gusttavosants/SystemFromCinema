export class ReservationResponseDTO {
  id: string;

  sessionId: string;

  userId: string;

  seatNumbers: number[];

  totalPriceInCents: number;

  status: 'pending' | 'confirmed' | 'expired' | 'cancelled';

  expiresAt: Date;

  createdAt: Date;
}
