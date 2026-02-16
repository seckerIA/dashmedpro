/**
 * Hook for managing VOIP configuration
 * Supports: WhatsApp Cloud API + SIP Trunking + Twilio
 * @module hooks/useVOIPConfig
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/components/ui/use-toast';
import type { VOIPConfig, VOIPConfigUpdate, VOIPValidationResponse } from '@/types/voip';

export const VOIP_CONFIG_QUERY_KEY = 'voip-config';

interface ValidateCredentialsPayload {
  // WhatsApp Config
  whatsapp_phone_number_id?: string;
  whatsapp_business_id?: string;
  whatsapp_access_token?: string;

  // SIP Config
  sip_domain?: string;
  sip_username?: string;
  sip_password?: string;
  sip_server_hostname?: string;

  // Twilio (optional, for WebRTC bridge)
  twilio_account_sid?: string;
  twilio_auth_token?: string;
  twilio_api_key_sid?: string;
  twilio_api_key_secret?: string;
  twilio_twiml_app_sid?: string;

  // Common
  display_phone_number?: string;
  recording_enabled?: boolean;
}

export function useVOIPConfig() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Fetch current config
  const configQuery = useQuery({
    queryKey: [VOIP_CONFIG_QUERY_KEY, user?.id],
    queryFn: async (): Promise<VOIPConfig | null> => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from('voip_config' as any)
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        // Gracefully handle missing table (PGRST205) - VOIP not set up yet
        if (error.code === 'PGRST205' || error.message?.includes('Could not find')) {
          console.log('[useVOIPConfig] VOIP tables not migrated yet - skipping');
          return null;
        }
        console.error('[useVOIPConfig] Fetch error:', error);
        return null; // Return null instead of throwing to prevent console spam
      }

      return data as unknown as VOIPConfig | null;
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
    retry: false, // Don't retry if table doesn't exist
  });

  // Validate and save credentials
  const validateCredentialsMutation = useMutation({
    mutationFn: async (payload: ValidateCredentialsPayload): Promise<VOIPValidationResponse> => {
      const response = await supabase.functions.invoke('voip-config-validate', {
        body: payload,
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      if (!response.data.success) {
        throw new Error(response.data.error || 'Validation failed');
      }

      return response.data as VOIPValidationResponse;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [VOIP_CONFIG_QUERY_KEY] });
      toast({
        title: 'VOIP Configurado!',
        description: data.message || 'Suas credenciais foram validadas e salvas.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro na Validacao',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Direct save (upsert) for WhatsApp config
  const saveConfigMutation = useMutation({
    mutationFn: async (payload: ValidateCredentialsPayload): Promise<VOIPConfig> => {
      if (!user?.id) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('voip_config' as any)
        .upsert({
          user_id: user.id,
          ...payload,
          verified_at: new Date().toISOString(),
          is_active: true,
        }, { onConflict: 'user_id' })
        .select()
        .single();

      if (error) throw error;
      return data as unknown as VOIPConfig;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [VOIP_CONFIG_QUERY_KEY] });
      toast({
        title: 'Configuração Salva',
        description: 'Suas configurações de voz foram salvas.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao Salvar',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Update config (partial update)
  const updateConfigMutation = useMutation({
    mutationFn: async (updates: VOIPConfigUpdate): Promise<VOIPConfig> => {
      if (!user?.id) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('voip_config' as any)
        .update(updates)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      return data as unknown as VOIPConfig;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [VOIP_CONFIG_QUERY_KEY] });
      toast({
        title: 'Configuracao Atualizada',
        description: 'Suas configuracoes VOIP foram salvas.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao Atualizar',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Toggle active status
  const toggleActiveMutation = useMutation({
    mutationFn: async (isActive: boolean): Promise<VOIPConfig> => {
      if (!user?.id) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('voip_config' as any)
        .update({ is_active: isActive })
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      return data as unknown as VOIPConfig;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [VOIP_CONFIG_QUERY_KEY] });
      toast({
        title: data.is_active ? 'VOIP Ativado' : 'VOIP Desativado',
        description: data.is_active
          ? 'Voce agora pode fazer e receber chamadas.'
          : 'As chamadas VOIP foram desativadas.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Delete config
  const deleteConfigMutation = useMutation({
    mutationFn: async (): Promise<void> => {
      if (!user?.id) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('voip_config' as any)
        .delete()
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [VOIP_CONFIG_QUERY_KEY] });
      toast({
        title: 'Configuracao Removida',
        description: 'Suas credenciais VOIP foram removidas.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao Remover',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Computed states
  const config = configQuery.data;

  // WhatsApp is configured if we have phone number ID and access token
  const hasWhatsAppConfig = !!config?.whatsapp_phone_number_id && !!config?.whatsapp_access_token;

  // SIP is configured if we have credentials
  const hasSIPConfig = !!config?.sip_username && !!config?.sip_password;

  // System is ready if WhatsApp is configured and active
  const isReady = hasWhatsAppConfig && (config?.is_active ?? false);
  const isActive = config?.is_active ?? false;

  return {
    // Data
    config: configQuery.data,
    isLoading: configQuery.isLoading,
    error: configQuery.error,

    // Computed
    hasWhatsAppConfig,
    hasSIPConfig,
    isActive,
    isReady,

    // Actions
    validateCredentials: validateCredentialsMutation.mutateAsync,
    isValidating: validateCredentialsMutation.isPending,

    saveConfig: saveConfigMutation.mutateAsync,
    isSaving: saveConfigMutation.isPending,

    updateConfig: updateConfigMutation.mutateAsync,
    isUpdating: updateConfigMutation.isPending,

    toggleActive: toggleActiveMutation.mutateAsync,
    isToggling: toggleActiveMutation.isPending,

    deleteConfig: deleteConfigMutation.mutateAsync,
    isDeleting: deleteConfigMutation.isPending,

    refetch: configQuery.refetch,
  };
}
