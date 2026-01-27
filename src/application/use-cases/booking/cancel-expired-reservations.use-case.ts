import { Injectable } from '@nestjs/common';

import type { IReservationRepository } from '@domain/booking/repositories/reservation.repository';
import { UnitOfWork } from '@infrastructure/database/unit-of-work';
import { WithLock } from '@shared/decorators/with-lock.decorator';
import { DistributedLockService } from '@infrastructure/cache';
import { EventsPublisherService } from '@infrastructure/events';

@Injectable()
export class CancelExpiredReservationsUseCase {
  constructor(
    private readonly unitOfWork: UnitOfWork,
    private readonly reservationRepository: IReservationRepository,
    private readonly distributedLockService: DistributedLockService,
    private readonly eventsPublisher: EventsPublisherService,
  ) {}

  @WithLock('reservations:expire', { ttl: 60000, maxRetries: 3 })
  async execute(): Promise<{ cancelledCount: number }> {
    let cancelledCount = 0;

    await this.unitOfWork.transaction(async () => {
      const expiredReservations =
        await this.reservationRepository.findExpiredReservations();

      for (const reservation of expiredReservations) {
        reservation.markAsExpired();
        await this.reservationRepository.update(reservation);
        cancelledCount++;

        // Publicar eventos para liberar cada assento
        for (const seatNumber of reservation.getSeatNumbers()) {
          await this.eventsPublisher.publishSeatReleased({
            sessionId: reservation.getSessionId(),
            seatNumber,
            releasedAt: new Date(),
            reason: 'expired',
          });
        }
      }
    });

    return { cancelledCount };
  }
}
