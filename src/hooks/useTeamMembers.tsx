import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { supabaseQueryWithTimeout } from '@/utils/supabaseQuery';
import { ensureValidSession } from '@/utils/supabaseHelpers';

export interface TeamMember {
  id: string;
  email: string;
  full_name: string | null;
  role: string;
}

const fetchTeamMembers = async (signal?: AbortSignal): Promise<TeamMember[]> => {
  // Verificar e garantir sessão válida
  await ensureValidSession();

  const queryPromise = supabase
    .from('profiles')
    .select('id, email, full_name, role')
    .eq('is_active', true)
    .order('full_name', { ascending: true });

  const { data, error } = await supabaseQueryWithTimeout(queryPromise, 30000, signal);

  if (error) throw new Error(`Erro ao buscar membros da equipe: ${error.message}`);
  return data || [];
};

export function useTeamMembers() {
  const {
    data: teamMembers = [],
    isLoading,
    error
  } = useQuery({
    queryKey: ['team-members'],
    queryFn: ({ signal }) => fetchTeamMembers(signal),
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    retry: 2,
    retryDelay: 1000,
  });

  return {
    teamMembers,
    isLoading,
    error
  };
}

