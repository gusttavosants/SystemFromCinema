import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { EventsPublisherService } from './events-publisher.service';
import { CancelExpiredReservationsUseCase } from '@application/use-cases/booking/cancel-expired-reservations.use-case';
import type { IReservationRepository } from '@domain/booking/repositories/reservation.repository';

@Injectable()
export class ReservationExpirationWorker {
  private readonly logger = new Logger(ReservationExpirationWorker.name);

  constructor(
    private readonly eventsPublisher: EventsPublisherService,
    private readonly reservationRepository: IReservationRepository,
    private readonly cancelExpiredReservationsUseCase: CancelExpiredReservationsUseCase,
  ) {}

  @Cron(CronExpression.EVERY_5_SECONDS)
  async checkExpiredReservations(): Promise<void> {
    try {
      this.logger.debug('Checking for expired reservations...');

      const expiredReservations =
        await this.reservationRepository.findExpiredReservations();

      if (expiredReservations.length === 0) {
        this.logger.debug('No expired reservations found');
        return;
      }

      this.logger.log(
        `Found ${expiredReservations.length} expired reservations`,
      );

      // Cancelar reservas expiradas
      const result = await this.cancelExpiredReservationsUseCase.execute();
      this.logger.log(
        `Cancelled ${result.cancelledCount} expired reservations`,
      );

      // Publicar eventos de expiração para cada reserva
      for (const reservation of expiredReservations) {
        await this.eventsPublisher.publishReservationExpired({
          reservationId: reservation.getId(),
          sessionId: reservation.getSessionId(),
          seatNumbers: reservation.getSeatNumbers(),
          expiredAt: new Date(),
        });
      }
    } catch (error) {
      this.logger.error(
        `Error checking expired reservations: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined,
      );
    }
  }
}
