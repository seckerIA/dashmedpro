import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { supabaseQueryWithTimeout } from '@/utils/supabaseQuery';

export interface Doctor {
  id: string;
  email: string;
  full_name: string | null;
  role: string;
}

const fetchDoctors = async (signal?: AbortSignal): Promise<Doctor[]> => {
  // Verificar e garantir sessao valida

  // Buscar apenas médicos, admin e dono (quem pode ter consultas/procedimentos)
  const queryPromise = supabase
    .from('profiles')
    .select('id, email, full_name, role')
    .eq('is_active', true)
    .in('role', ['medico', 'admin', 'dono'])
    .order('full_name', { ascending: true });

  const { data, error } = await supabaseQueryWithTimeout(queryPromise as any, 30000, signal);

  if (error) {
    console.error('[useDoctors] ERRO:', error);
    throw new Error(`Erro ao buscar medicos: ${error.message}`);
  }

  return (data as Doctor[]) || [];
};

export function useDoctors() {
  const {
    data: doctors = [],
    isLoading,
    error
  } = useQuery({
    queryKey: ['doctors'],
    queryFn: ({ signal }) => fetchDoctors(signal),
    staleTime: 0, // Sempre buscar dados frescos para evitar cache de permissões antigas
    gcTime: 10 * 60 * 1000,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    retry: 2,
    retryDelay: 1000,
  });

  return {
    doctors,
    isLoading,
    error
  };
}
