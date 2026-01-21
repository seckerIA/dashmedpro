import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { supabaseQueryWithTimeout } from '@/utils/supabaseQuery';
import { ensureValidSession } from '@/utils/supabaseHelpers';
import { useAuth } from './useAuth';

export interface TeamMember {
  id: string;
  email: string;
  full_name: string | null;
  role: string;
}

const fetchTeamMembers = async (userId: string | undefined, signal?: AbortSignal): Promise<TeamMember[]> => {
  // Verificar e garantir sessão válida
  await ensureValidSession();

  if (!userId) return [];

  // 1. Buscar role do usuário atual
  const { data: currentUserProfile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single();

  if (profileError) {
    console.error('Erro ao buscar perfil do usuário:', profileError);
    return [];
  }

  const role = currentUserProfile?.role;
  let queryPromise;

  // 2. Construir query baseada no role
  if (role === 'dono' || role === 'admin') {
    // Dono/Admin vê todos
    queryPromise = supabase
      .from('profiles')
      .select('id, email, full_name, role')
      .eq('is_active', true)
      .order('full_name', { ascending: true });
  } else if (role === 'medico') {
    // Médico vê apenas secretárias vinculadas (não inclui a si mesmo)
    // Se não atribuir a ninguém, a tarefa vai para ele mesmo por padrão
    const { data: links } = await supabase
      .from('secretary_doctor_links')
      .select('secretary_id')
      .eq('doctor_id', userId);

    const secretaryIds = links?.map(l => l.secretary_id) || [];

    // Se não há secretárias vinculadas, retorna lista vazia
    if (secretaryIds.length === 0) {
      return [];
    }

    queryPromise = supabase
      .from('profiles')
      .select('id, email, full_name, role')
      .in('id', secretaryIds)
      .eq('is_active', true)
      .order('full_name', { ascending: true });
  } else if (role === 'secretaria') {
    // Secretária vê apenas médicos vinculados e a si mesma
    const { data: links } = await supabase
      .from('secretary_doctor_links')
      .select('doctor_id')
      .eq('secretary_id', userId);

    const allowedIds = [userId, ...(links?.map(l => l.doctor_id) || [])];

    queryPromise = supabase
      .from('profiles')
      .select('id, email, full_name, role')
      .in('id', allowedIds)
      .eq('is_active', true)
      .order('full_name', { ascending: true });
  } else {
    // Outros roles veem apenas a si mesmos por segurança
    queryPromise = supabase
      .from('profiles')
      .select('id, email, full_name, role')
      .eq('id', userId)
      .eq('is_active', true);
  }

  const { data, error } = await supabaseQueryWithTimeout(queryPromise, undefined, signal);

  if (error) throw new Error(`Erro ao buscar membros da equipe: ${error.message}`);
  return data || [];
};

export function useTeamMembers() {
  const { user } = useAuth();

  const {
    data: teamMembers = [],
    isLoading,
    error
  } = useQuery({
    queryKey: ['team-members', user?.id],
    queryFn: ({ signal }) => fetchTeamMembers(user?.id, signal),
    enabled: !!user?.id,
    staleTime: 10 * 60 * 1000, // 10 minutos
    gcTime: 30 * 60 * 1000, // 30 minutos para idle longo
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


