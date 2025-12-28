import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { supabaseQueryWithTimeout } from '@/utils/supabaseQuery';
import { ensureValidSession } from '@/utils/supabaseHelpers';

export interface Doctor {
  id: string;
  email: string;
  full_name: string | null;
  role: string;
}

const fetchDoctors = async (signal?: AbortSignal): Promise<Doctor[]> => {
  // Verificar e garantir sessao valida
  await ensureValidSession();

  const queryPromise = supabase
    .from('profiles')
    .select('id, email, full_name, role')
    .in('role', ['dono', 'medico'])
    .eq('is_active', true)
    .order('full_name', { ascending: true });

  const { data, error } = await supabaseQueryWithTimeout(queryPromise, 30000, signal);

  if (error) throw new Error(`Erro ao buscar medicos: ${error.message}`);
  return data || [];
};

export function useDoctors() {
  const {
    data: doctors = [],
    isLoading,
    error
  } = useQuery({
    queryKey: ['doctors'],
    queryFn: ({ signal }) => fetchDoctors(signal),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
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
