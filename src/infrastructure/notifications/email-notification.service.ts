import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';

export interface EmailNotification {
  to: string;
  subject: string;
  template?: string;
  context?: Record<string, any>;
}

export interface ReservationConfirmationData {
  customerName: string;
  movieTitle: string;
  showTime: string;
  seatNumbers: number[];
  totalPrice: number;
  reservationId: string;
}

export interface PaymentConfirmationData {
  customerName: string;
  movieTitle: string;
  seatNumbers: number[];
  totalPrice: number;
  purchaseDate: string;
}

export interface ReservationExpiredData {
  customerName: string;
  movieTitle: string;
  showTime: string;
  seatNumbers: number[];
}

@Injectable()
export class EmailNotificationService {
  constructor(private readonly mailerService: MailerService) {}

  async sendEmail(notification: EmailNotification): Promise<void> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      await (this.mailerService as any).sendMail({
        to: notification.to,
        subject: notification.subject,
        template: notification.template,
        context: notification.context,
      });
    } catch (error) {
      console.error('Failed to send email:', error);
      throw error;
    }
  }

  async sendReservationConfirmation(
    email: string,
    reservationData: ReservationConfirmationData,
  ): Promise<void> {
    await this.sendEmail({
      to: email,
      subject: 'Reservation Confirmed - Cinema Booking',
      template: 'reservation-confirmation',
      context: {
        customerName: reservationData.customerName,
        movieTitle: reservationData.movieTitle,
        showTime: reservationData.showTime,
        seatNumbers: reservationData.seatNumbers,
        totalPrice: reservationData.totalPrice,
        reservationId: reservationData.reservationId,
      },
    });
  }

  async sendPaymentConfirmation(
    email: string,
    paymentData: PaymentConfirmationData,
  ): Promise<void> {
    await this.sendEmail({
      to: email,
      subject: 'Payment Confirmed - Cinema Booking',
      template: 'payment-confirmation',
      context: {
        customerName: paymentData.customerName,
        movieTitle: paymentData.movieTitle,
        seatNumbers: paymentData.seatNumbers,
        totalPrice: paymentData.totalPrice,
        purchaseDate: paymentData.purchaseDate,
      },
    });
  }

  async sendReservationExpired(
    email: string,
    reservationData: ReservationExpiredData,
  ): Promise<void> {
    await this.sendEmail({
      to: email,
      subject: 'Reservation Expired - Cinema Booking',
      template: 'reservation-expired',
      context: {
        customerName: reservationData.customerName,
        movieTitle: reservationData.movieTitle,
        showTime: reservationData.showTime,
        seatNumbers: reservationData.seatNumbers,
      },
    });
  }
}
