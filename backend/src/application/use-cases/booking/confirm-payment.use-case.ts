import { Injectable, Inject } from '@nestjs/common';

import { ConfirmPaymentRequestDTO, SaleResponseDTO } from '@application/dtos';
import { Sale } from '@domain/booking/entities/sale.entity';
import type { IReservationRepository } from '@domain/booking/repositories/reservation.repository';
import type { ISaleRepository } from '@domain/booking/repositories/sale.repository';
import type { IUserRepository } from '@domain/user/repositories/user.repository';
import type { ISessionRepository } from '@domain/cinema/repositories/session.repository';
import { UnitOfWork } from '@infrastructure/database/unit-of-work';
import { EventsPublisherService } from '@infrastructure/events';
import { EmailNotificationService } from '@infrastructure/notifications/email-notification.service';
import {
  ReservationNotFoundException,
  ReservationCannotBeConfirmedException,
  PaymentAmountMismatchException,
} from '@domain/cinema/exceptions';

@Injectable()
export class ConfirmPaymentUseCase {
  constructor(
    private readonly unitOfWork: UnitOfWork,
    @Inject('IReservationRepository')
    private readonly reservationRepository: IReservationRepository,
    @Inject('ISaleRepository')
    private readonly saleRepository: ISaleRepository,
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
    @Inject('ISessionRepository')
    private readonly sessionRepository: ISessionRepository,
    private readonly eventsPublisher: EventsPublisherService,
    private readonly emailNotificationService: EmailNotificationService,
  ) {}

  async execute(input: ConfirmPaymentRequestDTO): Promise<SaleResponseDTO> {
    let sale: Sale | undefined;

    await this.unitOfWork.transaction(async () => {
      const reservation = await this.reservationRepository.findById(
        input.reservationId,
      );

      if (!reservation) {
        throw new ReservationNotFoundException(input.reservationId);
      }

      if (!reservation.canBeConfirmed()) {
        throw new ReservationCannotBeConfirmedException(
          input.reservationId,
          reservation.getStatus(),
        );
      }

      // Validar que o valor pago é correto
      if (input.paidAmountInCents !== reservation.getTotalPrice().getValue()) {
        throw new PaymentAmountMismatchException(
          input.reservationId,
          reservation.getTotalPrice().getValue(),
          input.paidAmountInCents,
        );
      }

      // Confirmar reserva
      reservation.confirm();
      await this.reservationRepository.update(reservation);

      // Criar sale
      sale = Sale.create({
        reservationId: reservation.getId(),
        sessionId: reservation.getSessionId(),
        userId: reservation.getUserId(),
        seatNumbers: reservation.getSeatNumbers(),
        totalPrice: reservation.getTotalPrice(),
      });

      await this.saleRepository.create(sale);
    });

    if (!sale) {
      throw new Error('Sale was not created during payment confirmation');
    }

    // Publicar evento de pagamento confirmado
    await this.eventsPublisher.publishPaymentConfirmed({
      reservationId: sale.getReservationId(),
      sessionId: sale.getSessionId(),
      userId: sale.getUserId(),
      seatNumbers: sale.getSeatNumbers(),
      totalPriceInCents: sale.getTotalPrice().getValue(),
      confirmedAt: sale.getConfirmedAt(),
    });

    // Enviar notificação por email
    try {
      const user = await this.userRepository.findById(sale.getUserId());
      const session = await this.sessionRepository.findById(
        sale.getSessionId(),
      );

      if (user && session) {
        await this.emailNotificationService.sendPaymentConfirmation(
          user.getEmail(),
          {
            customerName: `${user.getFirstName()} ${user.getLastName()}`,
            movieTitle: session.getMovieTitle(),
            seatNumbers: sale.getSeatNumbers(),
            totalPrice: sale.getTotalPrice().getValue(),
            purchaseDate: sale.getConfirmedAt().toISOString(),
          },
        );
      }
    } catch (error) {
      // Não falhar o pagamento por causa de erro na notificação
      console.error('Failed to send payment confirmation email:', error);
    }

    return this.mapToResponse(sale);
  }

  private mapToResponse(sale: Sale): SaleResponseDTO {
    return {
      id: sale.getId(),
      reservationId: sale.getReservationId(),
      sessionId: sale.getSessionId(),
      userId: sale.getUserId(),
      seatNumbers: sale.getSeatNumbers(),
      totalPriceInCents: sale.getTotalPrice().getValue(),
      confirmedAt: sale.getConfirmedAt(),
    };
  }
}
