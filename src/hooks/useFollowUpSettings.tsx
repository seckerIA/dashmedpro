/**
 * Hook para gerenciar configurações de Follow-Up
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/components/ui/use-toast';
import type { FollowUpSettings, FollowUpSettingsUpdate, FollowUpAutomationLog } from '@/types/followUp';

const SETTINGS_KEY = 'followup-settings';
const AUTOMATION_LOG_KEY = 'followup-automation-log';

export function useFollowUpSettings() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // ==========================================
  // FETCH SETTINGS
  // ==========================================

  const {
    data: settings,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: [SETTINGS_KEY, user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from('followup_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;

      // Se não existir, criar configurações padrão
      if (!data) {
        const { data: newSettings, error: createError } = await supabase
          .rpc('create_default_followup_settings', { p_user_id: user.id });

        if (createError) {
          // Se RPC falhar, tentar insert direto
          const { data: inserted, error: insertError } = await supabase
            .from('followup_settings')
            .insert({ user_id: user.id })
            .select()
            .single();

          if (insertError) throw insertError;
          return transformSettings(inserted);
        }

        return transformSettings(newSettings);
      }

      return transformSettings(data);
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });

  // ==========================================
  // UPDATE SETTINGS
  // ==========================================

  const updateSettingsMutation = useMutation({
    mutationFn: async (updates: FollowUpSettingsUpdate) => {
      if (!user?.id) throw new Error('User not authenticated');

      // Transformar arrays de volta para JSONB se necessário
      const dbUpdates: Record<string, unknown> = { ...updates };

      if (updates.lead_vacuum_messages) {
        dbUpdates.lead_vacuum_messages = JSON.stringify(updates.lead_vacuum_messages);
      }

      const { data, error } = await supabase
        .from('followup_settings')
        .update(dbUpdates)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      return transformSettings(data);
    },
    onSuccess: (data) => {
      queryClient.setQueryData([SETTINGS_KEY, user?.id], data);
      toast({
        title: 'Configurações salvas',
        description: 'As configurações de follow-up foram atualizadas com sucesso.',
      });
    },
    onError: (error) => {
      console.error('Error updating settings:', error);
      toast({
        title: 'Erro ao salvar',
        description: 'Não foi possível salvar as configurações. Tente novamente.',
        variant: 'destructive',
      });
    },
  });

  // ==========================================
  // TOGGLE ENABLED
  // ==========================================

  const toggleEnabledMutation = useMutation({
    mutationFn: async (enabled: boolean) => {
      if (!user?.id) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('followup_settings')
        .update({ is_enabled: enabled })
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      return transformSettings(data);
    },
    onSuccess: (data) => {
      queryClient.setQueryData([SETTINGS_KEY, user?.id], data);
      toast({
        title: data.is_enabled ? 'Follow-ups ativados' : 'Follow-ups desativados',
        description: data.is_enabled
          ? 'O sistema de follow-up automático está ativo.'
          : 'O sistema de follow-up automático foi pausado.',
      });
    },
  });

  // ==========================================
  // FETCH AUTOMATION LOGS
  // ==========================================

  const {
    data: automationLogs,
    isLoading: isLoadingLogs,
  } = useQuery({
    queryKey: [AUTOMATION_LOG_KEY, user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('followup_automation_log')
        .select(`
          *,
          contact:crm_contacts(id, full_name, phone)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      return data as (FollowUpAutomationLog & { contact: { id: string; full_name: string; phone: string } | null })[];
    },
    enabled: !!user?.id,
  });

  // ==========================================
  // RESET TO DEFAULTS
  // ==========================================

  const resetToDefaultsMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');

      // Deletar configurações atuais
      await supabase
        .from('followup_settings')
        .delete()
        .eq('user_id', user.id);

      // Criar novas com valores padrão
      const { data, error } = await supabase
        .from('followup_settings')
        .insert({ user_id: user.id })
        .select()
        .single();

      if (error) throw error;
      return transformSettings(data);
    },
    onSuccess: (data) => {
      queryClient.setQueryData([SETTINGS_KEY, user?.id], data);
      toast({
        title: 'Configurações restauradas',
        description: 'As configurações foram restauradas para os valores padrão.',
      });
    },
  });

  // ==========================================
  // HELPERS
  // ==========================================

  // Transformar dados do banco para o tipo TypeScript
  function transformSettings(data: Record<string, unknown>): FollowUpSettings {
    return {
      ...data,
      // Garantir que arrays JSONB sejam parseados corretamente
      lead_vacuum_messages: typeof data.lead_vacuum_messages === 'string'
        ? JSON.parse(data.lead_vacuum_messages)
        : data.lead_vacuum_messages || [],
      working_days: data.working_days || [1, 2, 3, 4, 5],
    } as FollowUpSettings;
  }

  return {
    // Data
    settings,
    automationLogs,

    // Loading states
    isLoading,
    isLoadingLogs,
    isSaving: updateSettingsMutation.isPending,

    // Error
    error,

    // Actions
    updateSettings: updateSettingsMutation.mutateAsync,
    toggleEnabled: toggleEnabledMutation.mutateAsync,
    resetToDefaults: resetToDefaultsMutation.mutateAsync,
    refetch,
  };
}
