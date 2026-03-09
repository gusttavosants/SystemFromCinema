import api from '@/lib/api';

export interface PaymentConfirmation {
  reservationId: string;
  paidAmountInCents: number;
}

export interface PaymentResponse {
  success: boolean;
  data: {
    saleId: string;
    reservationId: string;
    totalAmountInCents: number;
    status: string;
  };
}

export const paymentsService = {
  async confirmPayment(data: PaymentConfirmation): Promise<PaymentResponse> {
    return api.post('/payments/confirm', data);
  },
};
