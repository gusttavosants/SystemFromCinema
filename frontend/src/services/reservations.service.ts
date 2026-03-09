import api from '@/lib/api';

export interface Reservation {
  id: string;
  sessionId: string;
  userId: string;
  seatNumbers: number[];
  status: 'pending' | 'confirmed' | 'cancelled' | 'expired';
  expiresAt: string;
  createdAt: string;
}

export interface CreateReservationData {
  sessionId: string;
  userId: string;
  seatNumbers: number[];
}

export const reservationsService = {
  async createReservation(data: CreateReservationData): Promise<{ success: boolean; data: Reservation }> {
    return api.post('/reservations', data);
  },

  async getReservationById(id: string): Promise<{ success: boolean; data: Reservation }> {
    return api.get(`/reservations/${id}`);
  },

  async getSessionSeats(sessionId: string): Promise<{ success: boolean; data: { availableSeats: number[] } }> {
    return api.get(`/reservations/session/${sessionId}/seats`);
  },
};
