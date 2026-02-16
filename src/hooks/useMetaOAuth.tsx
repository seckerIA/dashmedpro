/**
 * Hook: useMetaOAuth
 * Gerencia OAuth centralizado do Meta Business Platform
 * Integrações: Meta Ads (+ WhatsApp via fluxo existente)
 *
 * Fluxo: FB.login() com scope → Token Exchange → Ad Accounts
 * Nota: Embedded Signup requer BSP/TP, então usamos FB.login() padrão
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/use-toast';
import {
  loadFacebookSDK,
  isFacebookSDKReady,
  fbLogin,
  FacebookLoginResponse,
} from '@/lib/facebookSDK';

// Configurações
const FB_APP_ID = import.meta.env.VITE_FB_APP_ID || '';

// Permissões Meta Ads + Business (apenas aprovadas no App Review)
const META_SCOPES = [
  'ads_management',
  'business_management',
  'pages_show_list',
  'pages_read_engagement',
  'pages_manage_metadata',
  'pages_manage_ads',
  'leads_retrieval',
  'email',
  'public_profile',
].join(',');

// Interfaces
interface WhatsAppConfig {
  id: string;
  waba_id: string;
  phone_number_id: string;
  display_phone_number: string;
  verified_name: string;
  oauth_connected: boolean;
  oauth_expires_at: string | null;
}

interface AdPlatformConnection {
  id: string;
  account_id: string;
  account_name: string;
  platform: string;
  is_active: boolean;
}

interface MetaIntegrationStatus {
  whatsapp: {
    connected: boolean;
    config?: WhatsAppConfig;
    expiresAt?: Date;
  };
  ads: {
    connected: boolean;
    connections: AdPlatformConnection[];
  };
}

export function useMetaOAuth() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [isConnecting, setIsConnecting] = useState(false);
  const [isSdkReady, setIsSdkReady] = useState(false);

  // =====================================================
  // Effect: Carregar Facebook SDK
  // =====================================================
  useEffect(() => {
    if (!FB_APP_ID) {
      console.warn('[Meta OAuth] FB_APP_ID not configured');
      return;
    }

    loadFacebookSDK(FB_APP_ID)
      .then(() => {
        setIsSdkReady(true);
        console.log('[Meta OAuth] Facebook SDK ready');
      })
      .catch((error) => {
        console.error('[Meta OAuth] Failed to load Facebook SDK:', error);
      });
  }, []);

  // =====================================================
  // Query: Buscar status das integrações
  // =====================================================
  const integrationStatusQuery = useQuery({
    queryKey: ['meta-integration-status', user?.id],
    queryFn: async (): Promise<MetaIntegrationStatus> => {
      if (!user) throw new Error('Usuário não autenticado');

      const [whatsappRes, adsRes] = await Promise.all([
        supabase
          .from('whatsapp_config')
          .select('*')
          .eq('user_id', user.id)
          .eq('is_active', true)
          .maybeSingle(),
        supabase
          .from('ad_platform_connections')
          .select('*')
          .eq('user_id', user.id)
          .eq('platform', 'meta_ads')
          .eq('is_active', true),
      ]);

      return {
        whatsapp: {
          connected: !!whatsappRes.data?.oauth_connected,
          config: whatsappRes.data as WhatsAppConfig | undefined,
          expiresAt: whatsappRes.data?.oauth_expires_at
            ? new Date(whatsappRes.data.oauth_expires_at)
            : undefined,
        },
        ads: {
          connected: (adsRes.data?.length || 0) > 0,
          connections: (adsRes.data || []) as AdPlatformConnection[],
        },
      };
    },
    enabled: !!user,
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
  });

  // =====================================================
  // Mutation: Trocar código/token por token long-lived e salvar configuração
  // =====================================================
  const exchangeTokenMutation = useMutation({
    mutationFn: async ({ code, access_token }: { code?: string; access_token?: string }) => {
      const response = await supabase.functions.invoke('meta-token-exchange', {
        body: { code, access_token },
      });

      if (response.error) throw response.error;
      if (!response.data?.success) throw new Error(response.data?.error || 'Falha ao trocar token');

      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meta-integration-status'] });
      queryClient.invalidateQueries({ queryKey: ['whatsapp-config'] });
      queryClient.invalidateQueries({ queryKey: ['ad-platform-connections'] });

      toast({
        title: 'Conexão realizada!',
        description: 'Suas contas Meta foram conectadas com sucesso.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao conectar',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // =====================================================
  // Action: Iniciar fluxo OAuth com FB.login()
  // =====================================================
  const startOAuthFlow = useCallback(async () => {
    if (!user) {
      toast({
        title: 'Erro',
        description: 'Você precisa estar logado para continuar',
        variant: 'destructive',
      });
      return;
    }

    if (!isSdkReady) {
      toast({
        title: 'Aguarde',
        description: 'Carregando SDK do Facebook...',
        variant: 'default',
      });
      return;
    }

    setIsConnecting(true);

    try {
      console.log('[Meta OAuth] Starting FB.login with scope:', META_SCOPES);

      // Chamar FB.login com scope padrão (sem Embedded Signup que requer BSP/TP)
      const response: FacebookLoginResponse = await fbLogin({
        scope: META_SCOPES,
        response_type: 'code',
        override_default_response_type: true,
      });

      console.log('[Meta OAuth] FB.login response:', response);

      if (response.authResponse?.code) {
        // Trocar código por token no backend
        await exchangeTokenMutation.mutateAsync({
          code: response.authResponse.code,
        });
      } else if (response.authResponse?.accessToken) {
        // Fallback: recebemos accessToken direto (sem code exchange)
        console.log('[Meta OAuth] Received accessToken directly, sending to backend');
        await exchangeTokenMutation.mutateAsync({
          access_token: response.authResponse.accessToken,
        });
      }
    } catch (error: unknown) {
      console.error('[Meta OAuth] Login error:', error);

      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';

      if (errorMessage.includes('cancelled') || errorMessage.includes('Login was cancelled')) {
        toast({
          title: 'Conexão cancelada',
          description: 'Você cancelou o processo de login.',
          variant: 'default',
        });
      } else {
        toast({
          title: 'Erro na conexão',
          description: errorMessage,
          variant: 'destructive',
        });
      }
    } finally {
      setIsConnecting(false);
    }
  }, [user, isSdkReady, toast, exchangeTokenMutation]);

  // =====================================================
  // Action: Desconectar integrações
  // =====================================================
  const disconnectMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Usuário não autenticado');

      // Desativar whatsapp_config
      await supabase
        .from('whatsapp_config')
        .update({ is_active: false, oauth_connected: false })
        .eq('user_id', user.id);

      // Desativar ad_platform_connections
      await supabase
        .from('ad_platform_connections')
        .update({ is_active: false })
        .eq('user_id', user.id)
        .eq('platform', 'meta_ads');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meta-integration-status'] });
      toast({
        title: 'Desconectado',
        description: 'Suas contas Meta foram desconectadas.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao desconectar',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // =====================================================
  // Estado computado
  // =====================================================
  const isConnected = useMemo(() => {
    return (
      integrationStatusQuery.data?.whatsapp?.connected ||
      integrationStatusQuery.data?.ads?.connected
    );
  }, [integrationStatusQuery.data]);

  return {
    // Estado
    isConnecting: isConnecting || exchangeTokenMutation.isPending,
    isOAuthConfigured: !!FB_APP_ID,
    isSdkReady,

    // Status de integrações
    integrationStatus: integrationStatusQuery.data,
    isLoadingStatus: integrationStatusQuery.isLoading,
    isConnected,

    // Ações
    startOAuthFlow,
    disconnect: disconnectMutation.mutate,
    isDisconnecting: disconnectMutation.isPending,

    // Invalidar queries
    refetchStatus: () => queryClient.invalidateQueries({ queryKey: ['meta-integration-status'] }),
  };
}
