import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface TeamMember {
  id: string;
  email: string;
  full_name: string | null;
  role: string;
}

const fetchTeamMembers = async (): Promise<TeamMember[]> => {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, email, full_name, role')
    .eq('is_active', true)
    .order('full_name', { ascending: true });

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
    queryFn: fetchTeamMembers,
  });

  return {
    teamMembers,
    isLoading,
    error
  };
}

