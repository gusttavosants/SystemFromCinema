import api from '@/lib/api';

export interface Session {
  id: string;
  movieTitle: string;
  room: string;
  showTime: string;
  totalSeats: number;
  availableSeats: number;
  priceInCents: number;
}

export interface CreateSessionData {
  movieTitle: string;
  room: string;
  showTime: string;
  totalSeats: number;
  priceInCents: number;
}

export interface SessionAvailability {
  sessionId: string;
  availableSeats: number;
  totalSeats: number;
  occupancyRate: number;
}

export const sessionsService = {
  async getAllSessions(): Promise<{ success: boolean; data: Session[] }> {
    return api.get('/sessions');
  },

  async getSessionById(id: string): Promise<{ success: boolean; data: Session }> {
    return api.get(`/sessions/${id}`);
  },

  async createSession(data: CreateSessionData): Promise<{ success: boolean; data: Session }> {
    return api.post('/sessions', data);
  },

  async getSessionAvailability(id: string): Promise<{ success: boolean; data: SessionAvailability }> {
    return api.get(`/sessions/${id}/availability`);
  },

  async getAvailableSeats(id: string): Promise<{ success: boolean; data: { availableSeats: number[] } }> {
    return api.get(`/sessions/${id}/available-seats`);
  },
};
