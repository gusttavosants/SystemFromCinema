export class SaleResponseDTO {
  id: string;

  reservationId: string;

  sessionId: string;

  userId: string;

  seatNumbers: number[];

  totalPriceInCents: number;

  confirmedAt: Date;
}
