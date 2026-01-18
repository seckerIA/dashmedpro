/**
 * Hook para buscar secretárias vinculadas ao médico logado
 * Permite que médicos vejam conversas WhatsApp das secretárias vinculadas
 * @module hooks/useDoctorSecretaries
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export const DOCTOR_SECRETARIES_KEY = 'doctor-secretaries';

/**
 * Busca IDs das secretárias vinculadas ao médico atual
 * Usado para acesso bidirecional WhatsApp: médico vê conversas das secretárias
 */
export function useDoctorSecretaries() {
  const { user } = useAuth();

  const { data, isLoading, error } = useQuery({
    queryKey: [DOCTOR_SECRETARIES_KEY, user?.id],
    queryFn: async (): Promise<string[]> => {
      if (!user?.id) return [];

      // 1. Buscar role do usuário
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle(); // Changed to maybeSingle to handle null gracefully

      const role = profile?.role;
      const isOwnerOrAdmin = role === 'dono' || role === 'admin';

      // 2. Se for Dono ou Admin, retorna TODAS as secretárias
      if (isOwnerOrAdmin) {
        const { data: secretaries, error } = await supabase
          .from('profiles')
          .select('id')
          .eq('role', 'secretaria')
          .eq('is_active', true);

        if (error) {
          console.error('[useDoctorSecretaries] Error fetching all secretaries:', error);
          // Fallback
        } else {
          return (secretaries as any[])?.map(s => s.id) || [];
        }
      }

      // 3. Comportamento padrão (Médicos): Apenas vinculadas
      const { data, error } = await supabase
        .from('secretary_doctor_links')
        .select('secretary_id')
        .eq('doctor_id', user.id);

      if (error) {
        console.error('[useDoctorSecretaries] Error fetching secretaries:', error);
        throw error;
      }

      return (data as any[])?.map(link => link.secretary_id) || [];
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos
  });

  return {
    secretaryIds: data || [],
    isLoading,
    error,
  };
}
