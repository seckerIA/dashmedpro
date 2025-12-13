import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface TeamMember {
  id: string;
  full_name: string | null;
  email: string;
  role: string;
  created_at: string;
}

export function useTeamMembersForAdmin() {
  const { user } = useAuth();

  const { data: teamMembers, isLoading, error } = useQuery({
    queryKey: ['team-members-for-admin', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      // Buscar todos os usuários da equipe
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email, role, created_at')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erro ao buscar membros da equipe:', error);
        throw error;
      }

      return data as TeamMember[];
    },
    enabled: !!user?.id,
  });

  return {
    teamMembers,
    isLoading,
    error,
  };
}
