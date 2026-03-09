import { useMutation, useQueryClient } from '@tanstack/react-query';
import { paymentsService, PaymentConfirmation } from '@/services/payments.service';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

export const usePayments = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const confirmPaymentMutation = useMutation({
    mutationFn: (data: PaymentConfirmation) => paymentsService.confirmPayment(data),
    onSuccess: (response) => {
      toast.success('Pagamento confirmado com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['session-seats'] });
      queryClient.invalidateQueries({ queryKey: ['session-availability'] });
      navigate(`/confirmation/${response.data.saleId}`);
    },
    onError: (error: Error) => {
      toast.error('Erro ao confirmar pagamento. A reserva pode ter expirado.');
      console.error(error);
    },
  });

  return {
    confirmPayment: confirmPaymentMutation.mutate,
    isConfirming: confirmPaymentMutation.isPending,
    paymentData: confirmPaymentMutation.data?.data,
  };
};
