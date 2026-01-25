import { Injectable } from '@nestjs/common';

import type { IReservationRepository } from '@domain/booking/repositories/reservation.repository';
import { UnitOfWork } from '@infrastructure/database/unit-of-work';

@Injectable()
export class CancelExpiredReservationsUseCase {
  constructor(
    private readonly unitOfWork: UnitOfWork,
    private readonly reservationRepository: IReservationRepository,
  ) {}

  async execute(): Promise<{ cancelledCount: number }> {
    let cancelledCount = 0;

    await this.unitOfWork.transaction(async () => {
      const expiredReservations =
        await this.reservationRepository.findExpiredReservations();

      for (const reservation of expiredReservations) {
        reservation.markAsExpired();
        await this.reservationRepository.update(reservation);
        cancelledCount++;
      }
    });

    return { cancelledCount };
  }
}
