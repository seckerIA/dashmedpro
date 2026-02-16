/**
 * Hook: useWhatsAppOAuth
 * Gerencia o fluxo de OAuth do Facebook para WhatsApp Business
 */

import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/use-toast';

// Configurações do OAuth (usar variáveis de ambiente)
const FB_APP_ID = import.meta.env.VITE_FB_APP_ID || '';
const OAUTH_REDIRECT_URI = import.meta.env.VITE_SUPABASE_URL
    ? `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/whatsapp-oauth-callback`
    : '';

const OAUTH_SCOPES = [
    'whatsapp_business_management',
    'whatsapp_business_messaging',
    'business_management'
].join(',');

export interface WhatsAppBusinessAccount {
    id: string;
    name: string;
    phone_numbers: Array<{
        id: string;
        display_phone_number: string;
        verified_name: string;
        quality_rating: string;
    }>;
}

export interface OAuthSession {
    id: string;
    user_id: string;
    wabas: WhatsAppBusinessAccount[];
    expires_at: string;
}

export interface OAuthStatus {
    isConfigured: boolean;
    hasOAuthSession: boolean;
    sessionId: string | null;
    wabas: WhatsAppBusinessAccount[];
}

export function useWhatsAppOAuth() {
    const { user } = useAuth();
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [isConnecting, setIsConnecting] = useState(false);

    // Verificar se há sessão OAuth pendente (após redirect)
    const sessionIdFromUrl = typeof window !== 'undefined'
        ? new URLSearchParams(window.location.search).get('session')
        : null;

    // Query: Buscar sessão OAuth se houver session_id na URL
    const oauthSessionQuery = useQuery({
        queryKey: ['whatsapp-oauth-session', sessionIdFromUrl],
        queryFn: async () => {
            if (!sessionIdFromUrl || !user) return null;

            const { data, error } = await supabase
                .from('whatsapp_oauth_sessions')
                .select('*')
                .eq('id', sessionIdFromUrl)
                .eq('user_id', user.id)
                .single();

            if (error) {
                console.error('[OAuth] Error fetching session:', error);
                return null;
            }

            return data as OAuthSession;
        },
        enabled: !!sessionIdFromUrl && !!user,
        staleTime: 0, // Sempre buscar fresh
    });

    // Iniciar fluxo OAuth (abre popup do Facebook)
    const startOAuthFlow = useCallback(() => {
        if (!user) {
            toast({
                title: 'Erro',
                description: 'Você precisa estar logado para continuar',
                variant: 'destructive'
            });
            return;
        }

        if (!FB_APP_ID) {
            toast({
                title: 'Configuração incompleta',
                description: 'Facebook App ID não configurado. Contate o administrador.',
                variant: 'destructive'
            });
            return;
        }

        setIsConnecting(true);

        // Construir URL do OAuth
        const authUrl = new URL('https://www.facebook.com/v18.0/dialog/oauth');
        authUrl.searchParams.set('client_id', FB_APP_ID);
        authUrl.searchParams.set('redirect_uri', OAUTH_REDIRECT_URI);
        authUrl.searchParams.set('scope', OAUTH_SCOPES);
        authUrl.searchParams.set('state', user.id);
        authUrl.searchParams.set('response_type', 'code');

        console.log('[OAuth] Redirecting to:', authUrl.toString());

        // Redirecionar para Facebook
        window.location.href = authUrl.toString();
    }, [user, toast]);

    // Mutation: Selecionar número e finalizar configuração
    const selectPhoneMutation = useMutation({
        mutationFn: async ({ wabaId, phoneNumberId }: { wabaId: string; phoneNumberId: string }) => {
            if (!sessionIdFromUrl) throw new Error('Sessão OAuth não encontrada');

            const response = await supabase.functions.invoke('whatsapp-oauth-callback', {
                body: {
                    session_id: sessionIdFromUrl,
                    waba_id: wabaId,
                    phone_number_id: phoneNumberId
                }
            });

            if (response.error) throw new Error(response.error.message);
            if (!response.data?.success) throw new Error(response.data?.error || 'Falha ao configurar');

            return response.data;
        },
        onSuccess: (data) => {
            // Limpar URL
            const url = new URL(window.location.href);
            url.searchParams.delete('oauth');
            url.searchParams.delete('session');
            window.history.replaceState({}, '', url.toString());

            // Invalidar queries
            queryClient.invalidateQueries({ queryKey: ['whatsapp-config'] });
            queryClient.invalidateQueries({ queryKey: ['whatsapp-oauth-session'] });

            toast({
                title: '✅ WhatsApp conectado!',
                description: `Número ${data.config.phone_number} configurado com sucesso.`,
            });

            // Mostrar info de webhook se não foi configurado automaticamente
            if (!data.webhook_configured) {
                toast({
                    title: '⚠️ Webhook pendente',
                    description: 'Configure o webhook manualmente no Meta Developers.',
                });
            }
        },
        onError: (error: Error) => {
            toast({
                title: 'Erro ao configurar',
                description: error.message,
                variant: 'destructive'
            });
        }
    });

    // Limpar erro da URL se houver
    useEffect(() => {
        if (typeof window === 'undefined') return;

        const urlParams = new URLSearchParams(window.location.search);
        const error = urlParams.get('error');

        if (error) {
            toast({
                title: 'Erro na conexão',
                description: decodeURIComponent(error),
                variant: 'destructive'
            });

            // Limpar URL
            const url = new URL(window.location.href);
            url.searchParams.delete('error');
            window.history.replaceState({}, '', url.toString());
        }

        // Marcar sucesso no OAuth
        const oauthSuccess = urlParams.get('oauth');
        if (oauthSuccess === 'success') {
            setIsConnecting(false);
        }
    }, [toast]);

    // Cancelar sessão OAuth
    const cancelOAuthSession = useCallback(async () => {
        if (!sessionIdFromUrl) return;

        await supabase
            .from('whatsapp_oauth_sessions')
            .delete()
            .eq('id', sessionIdFromUrl);

        // Limpar URL
        const url = new URL(window.location.href);
        url.searchParams.delete('oauth');
        url.searchParams.delete('session');
        window.history.replaceState({}, '', url.toString());

        queryClient.invalidateQueries({ queryKey: ['whatsapp-oauth-session'] });
    }, [sessionIdFromUrl, queryClient]);

    return {
        // Estado
        isConnecting,
        hasOAuthSession: !!oauthSessionQuery.data,
        session: oauthSessionQuery.data,
        isLoadingSession: oauthSessionQuery.isLoading,

        // Ações
        startOAuthFlow,
        selectPhone: selectPhoneMutation.mutate,
        selectPhoneAsync: selectPhoneMutation.mutateAsync,
        cancelOAuthSession,
        isSelectingPhone: selectPhoneMutation.isPending,

        // Configuração
        isOAuthConfigured: !!FB_APP_ID,
    };
}
