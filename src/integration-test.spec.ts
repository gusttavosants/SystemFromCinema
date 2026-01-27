/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from './app.module';

describe('Cinema Booking System - Full Integration Test', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Complete Booking Flow', () => {
    let sessionId: string;
    let reservationId: string;
    let userId: string;

    beforeAll(() => {
      userId = 'test-user-123';
    });

    it('should create a session', () => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      return request(app.getHttpServer())
        .post('/sessions')
        .send({
          movieTitle: 'Test Movie',
          showTime: '2024-01-01T20:00:00Z',
          totalSeats: 50,
          priceInCents: 2500,
        })
        .expect(201)
        .then((response) => {
          expect(response.body.success).toBe(true);
          expect(response.body.data).toHaveProperty('id');
          expect(response.body.data.movieTitle).toBe('Test Movie');
          sessionId = response.body.data.id;
        });
    });

    it('should get session availability', () => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      return request(app.getHttpServer())
        .get(`/sessions/${sessionId}/availability`)
        .expect(200)
        .then((response) => {
          expect(response.body.success).toBe(true);
          expect(response.body.data.sessionId).toBe(sessionId);
          expect(response.body.data.totalSeats).toBe(50);
          expect(response.body.data.availableSeats).toHaveLength(50);
          expect(response.body.data.reservedSeats).toHaveLength(0);
          expect(response.body.data.soldSeats).toHaveLength(0);
        });
    });

    it('should create a reservation', () => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      return request(app.getHttpServer())
        .post('/reservations')
        .send({
          sessionId,
          userId,
          seatNumbers: [1, 2],
        })
        .expect(201)
        .then((response) => {
          expect(response.body.success).toBe(true);
          expect(response.body.data).toHaveProperty('id');
          expect(response.body.data.sessionId).toBe(sessionId);
          expect(response.body.data.userId).toBe(userId);
          expect(response.body.data.seatNumbers).toEqual([1, 2]);
          expect(response.body.data.status).toBe('pending');
          expect(response.body.data).toHaveProperty('expiresAt');
          reservationId = response.body.data.id;
        });
    });

    it('should show seats as reserved after reservation', () => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      return request(app.getHttpServer())
        .get(`/sessions/${sessionId}/availability`)
        .expect(200)
        .then((response) => {
          expect(response.body.success).toBe(true);
          expect(response.body.data.availableSeats).toHaveLength(48);
          expect(response.body.data.reservedSeats).toHaveLength(2);
          expect(response.body.data.soldSeats).toHaveLength(0);

          const reservedSeatNumbers = response.body.data.reservedSeats.map(
            // eslint-disable-next-line @typescript-eslint/no-unsafe-return
            (seat: any) => seat.seatNumber,
          );
          expect(reservedSeatNumbers).toEqual([1, 2]);
        });
    });

    it('should confirm payment', () => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      return request(app.getHttpServer())
        .post('/payments/confirm')
        .send({
          reservationId,
          paidAmountInCents: 5000, // 2 seats * 2500
        })
        .expect(200)
        .then((response) => {
          expect(response.body.success).toBe(true);
          expect(response.body.data).toHaveProperty('id');
          expect(response.body.data.reservationId).toBe(reservationId);
          expect(response.body.data.sessionId).toBe(sessionId);
          expect(response.body.data.userId).toBe(userId);
          expect(response.body.data.seatNumbers).toEqual([1, 2]);
          expect(response.body.data.totalPriceInCents).toBe(5000);
          expect(response.body.data).toHaveProperty('confirmedAt');
        });
    });

    it('should show seats as sold after payment', () => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      return request(app.getHttpServer())
        .get(`/sessions/${sessionId}/availability`)
        .expect(200)
        .then((response) => {
          expect(response.body.success).toBe(true);
          expect(response.body.data.availableSeats).toHaveLength(48);
          expect(response.body.data.reservedSeats).toHaveLength(0);
          expect(response.body.data.soldSeats).toHaveLength(2);

          const soldSeatNumbers = response.body.data.soldSeats.map(
            // eslint-disable-next-line @typescript-eslint/no-unsafe-return
            (seat: any) => seat.seatNumber,
          );
          expect(soldSeatNumbers).toEqual([1, 2]);
        });
    });

    it('should get user purchase history', () => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      return request(app.getHttpServer())
        .get(`/users/${userId}/purchases`)
        .expect(200)
        .then((response) => {
          expect(response.body.success).toBe(true);
          expect(response.body.data.userId).toBe(userId);
          expect(response.body.data.purchases).toHaveLength(1);
          expect(response.body.data.totalPurchases).toBe(1);

          const purchase = response.body.data.purchases[0];
          expect(purchase.sessionId).toBe(sessionId);
          expect(purchase.seatNumbers).toEqual([1, 2]);
          expect(purchase.totalPriceInCents).toBe(5000);
          expect(purchase).toHaveProperty('purchasedAt');
        });
    });
  });

  describe('Error Handling', () => {
    it('should return 404 for non-existent session', () => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      return request(app.getHttpServer())
        .get('/sessions/non-existent-session/availability')
        .expect(404)
        .then((response) => {
          expect(response.body.success).toBe(false);
          expect(response.body.error.code).toBe('SESSION_NOT_FOUND');
          expect(response.body.error.message).toContain('not found');
        });
    });

    it('should return 409 for already reserved seats', async () => {
      // First create a session

      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      const sessionResponse = await request(app.getHttpServer())
        .post('/sessions')
        .send({
          movieTitle: 'Error Test Movie',
          showTime: '2024-01-01T21:00:00Z',
          totalSeats: 10,
          priceInCents: 2000,
        });

      const testSessionId = sessionResponse.body.data.id;

      // Create first reservation

      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      await request(app.getHttpServer())
        .post('/reservations')
        .send({
          sessionId: testSessionId,
          userId: 'user-1',
          seatNumbers: [1],
        });

      // Try to reserve same seat again
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      return request(app.getHttpServer())
        .post('/reservations')
        .send({
          sessionId: testSessionId,
          userId: 'user-2',
          seatNumbers: [1],
        })
        .expect(409)
        .then((response) => {
          expect(response.body.success).toBe(false);
          expect(response.body.error.code).toBe('SEAT_NOT_AVAILABLE');
          expect(response.body.error.message).toContain('not available');
        });
    });

    it('should return 404 for non-existent reservation on payment', () => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      return request(app.getHttpServer())
        .post('/payments/confirm')
        .send({
          reservationId: 'non-existent-reservation',
          paidAmountInCents: 5000,
        })
        .expect(404)
        .then((response) => {
          expect(response.body.success).toBe(false);
          expect(response.body.error.code).toBe('RESERVATION_NOT_FOUND');
        });
    });
  });
});
