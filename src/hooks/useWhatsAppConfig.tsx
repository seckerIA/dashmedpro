/**
 * Hook para gerenciar configuração do WhatsApp Business API
 * @module hooks/useWhatsAppConfig
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/components/ui/use-toast';
import type {
  WhatsAppConfig,
  WhatsAppConfigInsert,
  WhatsAppConfigUpdate,
} from '@/types/whatsapp';

// Query keys
export const WHATSAPP_CONFIG_QUERY_KEY = 'whatsapp-config';

interface ValidateCredentialsPayload {
  phone_number_id: string;
  access_token: string;
  business_account_id?: string;
  waba_id?: string;
}

interface ValidateCredentialsResponse {
  success: boolean;
  config: {
    id: string;
    phone_number_id: string;
    display_phone_number: string;
    verified_name: string;
    is_active: boolean;
    webhook_verify_token: string;
  };
  webhook_url: string;
  quality_rating: string;
  message: string;
  next_steps: string[];
}

export function useWhatsAppConfig() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // =========================================
  // Query: Buscar configuração atual
  // =========================================
  const configQuery = useQuery({
    queryKey: [WHATSAPP_CONFIG_QUERY_KEY, user?.id],
    queryFn: async (): Promise<WhatsAppConfig | null> => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from('whatsapp_config')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('[useWhatsAppConfig] Error fetching config:', error);
        throw error;
      }

      return data as WhatsAppConfig | null;
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000,
  });

  // =========================================
  // Mutation: Validar e salvar credenciais
  // =========================================
  const validateCredentialsMutation = useMutation({
    mutationFn: async (payload: ValidateCredentialsPayload): Promise<ValidateCredentialsResponse> => {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session?.access_token) {
        throw new Error('Usuário não autenticado');
      }

      const response = await supabase.functions.invoke('whatsapp-config-validate', {
        body: payload,
      });

      if (response.error) {
        throw new Error(response.error.message || 'Erro ao validar credenciais');
      }

      if (!response.data.success) {
        throw new Error(response.data.error || 'Credenciais inválidas');
      }

      return response.data as ValidateCredentialsResponse;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [WHATSAPP_CONFIG_QUERY_KEY] });
      toast({
        title: 'Configuração salva!',
        description: `WhatsApp conectado: ${data.config.verified_name}`,
      });
    },
    onError: (error: Error) => {
      console.error('[useWhatsAppConfig] Validation error:', error);
      toast({
        title: 'Erro na validação',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // =========================================
  // Mutation: Atualizar configuração
  // =========================================
  const updateConfigMutation = useMutation({
    mutationFn: async (updates: WhatsAppConfigUpdate): Promise<WhatsAppConfig> => {
      if (!user?.id) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('whatsapp_config')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      return data as WhatsAppConfig;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [WHATSAPP_CONFIG_QUERY_KEY] });
      toast({
        title: 'Configuração atualizada',
        description: 'As alterações foram salvas.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao atualizar',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // =========================================
  // Mutation: Desativar WhatsApp
  // =========================================
  const deactivateMutation = useMutation({
    mutationFn: async (): Promise<void> => {
      if (!user?.id) throw new Error('Usuário não autenticado');

      const { error } = await supabase
        .from('whatsapp_config')
        .update({
          is_active: false,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [WHATSAPP_CONFIG_QUERY_KEY] });
      toast({
        title: 'WhatsApp desativado',
        description: 'A integração foi desativada.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao desativar',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // =========================================
  // Mutation: Reativar WhatsApp
  // =========================================
  const reactivateMutation = useMutation({
    mutationFn: async (): Promise<void> => {
      if (!user?.id) throw new Error('Usuário não autenticado');

      const { error } = await supabase
        .from('whatsapp_config')
        .update({
          is_active: true,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [WHATSAPP_CONFIG_QUERY_KEY] });
      toast({
        title: 'WhatsApp reativado',
        description: 'A integração foi reativada.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao reativar',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // =========================================
  // Mutation: Deletar configuração
  // =========================================
  const deleteConfigMutation = useMutation({
    mutationFn: async (): Promise<void> => {
      if (!user?.id) throw new Error('Usuário não autenticado');

      const { error } = await supabase
        .from('whatsapp_config')
        .delete()
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [WHATSAPP_CONFIG_QUERY_KEY] });
      toast({
        title: 'Configuração removida',
        description: 'A integração do WhatsApp foi removida.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao remover',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // =========================================
  // Helpers
  // =========================================
  const isConfigured = !!configQuery.data?.phone_number_id;
  const isActive = configQuery.data?.is_active ?? false;

  return {
    // Data
    config: configQuery.data,
    isLoading: configQuery.isLoading,
    isError: configQuery.isError,
    error: configQuery.error,

    // Status helpers
    isConfigured,
    isActive,

    // Mutations
    validateCredentials: validateCredentialsMutation.mutateAsync,
    isValidating: validateCredentialsMutation.isPending,
    validationError: validateCredentialsMutation.error,

    updateConfig: updateConfigMutation.mutateAsync,
    isUpdating: updateConfigMutation.isPending,

    deactivate: deactivateMutation.mutateAsync,
    isDeactivating: deactivateMutation.isPending,

    reactivate: reactivateMutation.mutateAsync,
    isReactivating: reactivateMutation.isPending,

    deleteConfig: deleteConfigMutation.mutateAsync,
    isDeleting: deleteConfigMutation.isPending,

    // Refetch
    refetch: configQuery.refetch,
  };
}
