import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { reservationsService, CreateReservationData } from '@/services/reservations.service';
import { toast } from 'sonner';

export const useReservations = () => {
  const queryClient = useQueryClient();

  const createReservationMutation = useMutation({
    mutationFn: (data: CreateReservationData) => reservationsService.createReservation(data),
    onSuccess: () => {
      toast.success('Reserva criada com sucesso! Você tem 30 segundos para confirmar o pagamento.');
      queryClient.invalidateQueries({ queryKey: ['session-seats'] });
      queryClient.invalidateQueries({ queryKey: ['session-availability'] });
    },
    onError: (error: Error) => {
      toast.error('Erro ao criar reserva. Os assentos podem já estar ocupados.');
      console.error(error);
    },
  });

  return {
    createReservation: createReservationMutation.mutate,
    isCreating: createReservationMutation.isPending,
    reservation: createReservationMutation.data?.data,
  };
};

export const useReservation = (id: string) => {
  const reservationQuery = useQuery({
    queryKey: ['reservation', id],
    queryFn: () => reservationsService.getReservationById(id),
    enabled: !!id,
    refetchInterval: 2000,
  });

  return {
    reservation: reservationQuery.data?.data,
    isLoading: reservationQuery.isLoading,
    error: reservationQuery.error,
  };
};
