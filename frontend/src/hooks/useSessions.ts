import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { sessionsService, CreateSessionData } from '@/services/sessions.service';
import { toast } from 'sonner';

export const useSessions = () => {
  const queryClient = useQueryClient();

  const sessionsQuery = useQuery({
    queryKey: ['sessions'],
    queryFn: () => sessionsService.getAllSessions(),
  });

  const createSessionMutation = useMutation({
    mutationFn: (data: CreateSessionData) => sessionsService.createSession(data),
    onSuccess: () => {
      toast.success('Sessão criada com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
    },
    onError: (error: Error) => {
      toast.error('Erro ao criar sessão');
      console.error(error);
    },
  });

  return {
    sessions: sessionsQuery.data?.data || [],
    isLoading: sessionsQuery.isLoading,
    error: sessionsQuery.error,
    createSession: createSessionMutation.mutate,
    isCreating: createSessionMutation.isPending,
  };
};

export const useSession = (id: string) => {
  const sessionQuery = useQuery({
    queryKey: ['session', id],
    queryFn: () => sessionsService.getSessionById(id),
    enabled: !!id,
  });

  const availabilityQuery = useQuery({
    queryKey: ['session-availability', id],
    queryFn: () => sessionsService.getSessionAvailability(id),
    enabled: !!id,
    refetchInterval: 5000,
  });

  const availableSeatsQuery = useQuery({
    queryKey: ['session-seats', id],
    queryFn: () => sessionsService.getAvailableSeats(id),
    enabled: !!id,
    refetchInterval: 3000,
  });

  return {
    session: sessionQuery.data?.data,
    availability: availabilityQuery.data?.data,
    availableSeats: availableSeatsQuery.data?.data?.availableSeats || [],
    isLoading: sessionQuery.isLoading,
    error: sessionQuery.error,
  };
};
