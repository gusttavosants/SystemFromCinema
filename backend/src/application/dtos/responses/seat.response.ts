export class SeatResponseDTO {
  id: string;

  sessionId: string;

  seatNumber: number;

  status: 'available' | 'reserved' | 'sold';
}
