/**
 * Hook para gerenciar atribuição de conversas WhatsApp
 * @module hooks/useWhatsAppAssignment
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useSecretaryDoctors } from '@/hooks/useSecretaryDoctors';
import { toast } from '@/components/ui/use-toast';
import { WHATSAPP_CONVERSATIONS_KEY } from './useWhatsAppConversations';

// Types
export interface AssignmentConfig {
    id: string;
    user_id: string;
    assignment_mode: 'manual' | 'round_robin' | 'weighted';
    auto_assign_new_conversations: boolean;
    notify_on_assignment: boolean;
    max_open_per_secretary: number;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface AssignmentPoolMember {
    id: string;
    config_id: string;
    secretary_id: string;
    weight: number;
    is_active: boolean;
    is_available: boolean;
    last_assigned_at: string | null;
    total_assigned: number;
    total_resolved: number;
    avg_response_time_seconds: number | null;
    created_at: string;
    secretary?: {
        id: string;
        full_name: string | null;
        email: string;
        avatar_url?: string | null;
    };
}

export interface AssignmentHistory {
    id: string;
    conversation_id: string;
    assigned_from: string | null;
    assigned_to: string;
    assigned_by: string | null;
    assignment_type: 'auto' | 'manual' | 'transfer' | 'escalation';
    notes: string | null;
    created_at: string;
    assigned_to_profile?: {
        full_name: string | null;
    };
    assigned_by_profile?: {
        full_name: string | null;
    };
}

// Query Keys
export const ASSIGNMENT_CONFIG_KEY = 'whatsapp-assignment-config';
export const ASSIGNMENT_POOL_KEY = 'whatsapp-assignment-pool';
export const ASSIGNMENT_HISTORY_KEY = 'whatsapp-assignment-history';

export function useWhatsAppAssignment() {
    const { user } = useAuth();
    const { doctorIds } = useSecretaryDoctors();
    const queryClient = useQueryClient();

    // Determinar o ID do dono (médico) para buscar config
    // Se for secretária, usa o primeiro médico vinculado
    const ownerId = doctorIds.length > 0 ? doctorIds[0] : user?.id;

    // =========================================
    // Query: Configuração de Atribuição
    // =========================================
    const configQuery = useQuery({
        queryKey: [ASSIGNMENT_CONFIG_KEY, ownerId],
        queryFn: async (): Promise<AssignmentConfig | null> => {
            if (!ownerId) return null;

            const { data, error } = await supabase
                .from('whatsapp_assignment_config')
                .select('*')
                .eq('user_id', ownerId)
                .single();

            if (error && error.code !== 'PGRST116') {
                console.error('[useWhatsAppAssignment] Config error:', error);
            }

            return data as AssignmentConfig | null;
        },
        enabled: !!ownerId,
        staleTime: 5 * 60 * 1000,
    });

    // =========================================
    // Query: Pool de Secretárias
    // =========================================
    const poolQuery = useQuery({
        queryKey: [ASSIGNMENT_POOL_KEY, configQuery.data?.id],
        queryFn: async (): Promise<AssignmentPoolMember[]> => {
            if (!configQuery.data?.id) return [];

            const { data, error } = await supabase
                .from('whatsapp_assignment_pool')
                .select(`
          *,
          secretary:profiles!whatsapp_assignment_pool_secretary_id_fkey (
            id, full_name, email, avatar_url
          )
        `)
                .eq('config_id', configQuery.data.id)
                .order('weight', { ascending: false });

            if (error) {
                console.error('[useWhatsAppAssignment] Pool error:', error);
                return [];
            }

            return (data || []) as AssignmentPoolMember[];
        },
        enabled: !!configQuery.data?.id,
        staleTime: 2 * 60 * 1000,
    });

    // =========================================
    // Mutation: Criar/Atualizar Configuração
    // =========================================
    const updateConfigMutation = useMutation({
        mutationFn: async (data: Partial<AssignmentConfig>) => {
            if (!user?.id) throw new Error('Not authenticated');

            const payload = {
                ...data,
                user_id: user.id,
            };

            const { data: result, error } = await supabase
                .from('whatsapp_assignment_config')
                .upsert(payload as any, { onConflict: 'user_id' })
                .select()
                .single();

            if (error) throw error;
            return result;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [ASSIGNMENT_CONFIG_KEY] });
            toast({
                title: 'Configuração salva',
                description: 'As configurações de atribuição foram atualizadas.',
            });
        },
        onError: (error: any) => {
            toast({
                title: 'Erro ao salvar',
                description: error.message,
                variant: 'destructive',
            });
        },
    });

    // =========================================
    // Mutation: Adicionar ao Pool
    // =========================================
    const addToPoolMutation = useMutation({
        mutationFn: async ({ secretaryId, weight = 1 }: { secretaryId: string; weight?: number }) => {
            if (!configQuery.data?.id) throw new Error('Config not found');

            const { error } = await supabase
                .from('whatsapp_assignment_pool')
                .insert({
                    config_id: configQuery.data.id,
                    secretary_id: secretaryId,
                    weight,
                } as any);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [ASSIGNMENT_POOL_KEY] });
            toast({ title: 'Secretária adicionada ao pool' });
        },
        onError: (error: any) => {
            toast({
                title: 'Erro ao adicionar',
                description: error.message,
                variant: 'destructive',
            });
        },
    });

    // =========================================
    // Mutation: Remover do Pool
    // =========================================
    const removeFromPoolMutation = useMutation({
        mutationFn: async (poolMemberId: string) => {
            const { error } = await supabase
                .from('whatsapp_assignment_pool')
                .delete()
                .eq('id', poolMemberId);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [ASSIGNMENT_POOL_KEY] });
            toast({ title: 'Secretária removida do pool' });
        },
        onError: (error: any) => {
            toast({
                title: 'Erro ao remover',
                description: error.message,
                variant: 'destructive',
            });
        },
    });

    // =========================================
    // Mutation: Atualizar membro do Pool
    // =========================================
    const updatePoolMemberMutation = useMutation({
        mutationFn: async ({ id, ...data }: { id: string } & Partial<AssignmentPoolMember>) => {
            const { error } = await supabase
                .from('whatsapp_assignment_pool')
                .update(data as any)
                .eq('id', id);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [ASSIGNMENT_POOL_KEY] });
        },
    });

    // =========================================
    // Mutation: Atribuir Conversa (via Edge Function)
    // =========================================
    const assignConversationMutation = useMutation({
        mutationFn: async ({
            conversationId,
            secretaryId,
            notes,
        }: {
            conversationId: string;
            secretaryId: string;
            notes?: string;
        }) => {
            const { data, error } = await supabase.functions.invoke('whatsapp-assign-conversation', {
                body: {
                    conversation_id: conversationId,
                    secretary_id: secretaryId,
                    notes,
                },
            });

            if (error) throw error;
            if (!data.success) throw new Error(data.error);

            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [WHATSAPP_CONVERSATIONS_KEY] });
            queryClient.invalidateQueries({ queryKey: [ASSIGNMENT_POOL_KEY] });
            toast({
                title: 'Conversa atribuída',
                description: 'A conversa foi atribuída com sucesso.',
            });
        },
        onError: (error: any) => {
            toast({
                title: 'Erro ao atribuir',
                description: error.message,
                variant: 'destructive',
            });
        },
    });

    // =========================================
    // Mutation: Desatribuir Conversa
    // =========================================
    const unassignConversationMutation = useMutation({
        mutationFn: async (conversationId: string) => {
            const { error } = await supabase
                .from('whatsapp_conversations')
                .update({ assigned_to: null })
                .eq('id', conversationId);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [WHATSAPP_CONVERSATIONS_KEY] });
            toast({
                title: 'Atribuição removida',
                description: 'A conversa voltou para o pool.',
            });
        },
        onError: (error: any) => {
            toast({
                title: 'Erro ao desatribuir',
                description: error.message,
                variant: 'destructive',
            });
        },
    });

    return {
        // Config
        config: configQuery.data,
        isLoadingConfig: configQuery.isLoading,
        updateConfig: updateConfigMutation.mutateAsync,
        isUpdatingConfig: updateConfigMutation.isPending,

        // Pool
        pool: poolQuery.data || [],
        isLoadingPool: poolQuery.isLoading,
        addToPool: addToPoolMutation.mutateAsync,
        removeFromPool: removeFromPoolMutation.mutateAsync,
        updatePoolMember: updatePoolMemberMutation.mutateAsync,

        // Assignment
        assignConversation: assignConversationMutation.mutateAsync,
        unassignConversation: unassignConversationMutation.mutateAsync,
        isAssigning: assignConversationMutation.isPending,

        // Helpers
        refetchConfig: configQuery.refetch,
        refetchPool: poolQuery.refetch,
    };
}

// =========================================
// Hook: Histórico de Atribuições
// =========================================
export function useAssignmentHistory(conversationId?: string) {
    return useQuery({
        queryKey: [ASSIGNMENT_HISTORY_KEY, conversationId],
        queryFn: async (): Promise<AssignmentHistory[]> => {
            if (!conversationId) return [];

            const { data, error } = await supabase
                .from('whatsapp_assignment_history')
                .select(`
          *,
          assigned_to_profile:profiles!whatsapp_assignment_history_assigned_to_fkey (full_name),
          assigned_by_profile:profiles!whatsapp_assignment_history_assigned_by_fkey (full_name)
        `)
                .eq('conversation_id', conversationId)
                .order('created_at', { ascending: false })
                .limit(20);

            if (error) {
                console.error('[useAssignmentHistory] Error:', error);
                return [];
            }

            return (data || []) as AssignmentHistory[];
        },
        enabled: !!conversationId,
    });
}

// =========================================
// Hook: Métricas de Secretárias (stats básicas)
// =========================================
export function useAssignmentMetrics(secretaryId?: string) {
    const { user } = useAuth();

    return useQuery({
        queryKey: ['assignment-metrics', secretaryId || user?.id],
        queryFn: async () => {
            const targetId = secretaryId || user?.id;
            if (!targetId) return null;

            // Buscar estatísticas de conversas
            const { data: conversations } = await supabase
                .from('whatsapp_conversations')
                .select('id, status, created_at, updated_at')
                .eq('assigned_to', targetId);

            const total = conversations?.length || 0;
            const open = conversations?.filter(c => c.status === 'open').length || 0;
            const resolved = conversations?.filter(c => c.status === 'resolved').length || 0;

            // Buscar do pool para métricas históricas
            const { data: poolEntry } = await supabase
                .from('whatsapp_assignment_pool')
                .select('total_assigned, total_resolved, avg_response_time_seconds')
                .eq('secretary_id', targetId)
                .single();

            return {
                currentOpen: open,
                currentTotal: total,
                totalAssigned: poolEntry?.total_assigned || 0,
                totalResolved: poolEntry?.total_resolved || resolved,
                avgResponseTime: poolEntry?.avg_response_time_seconds || null,
            };
        },
        enabled: !!secretaryId || !!user?.id,
        staleTime: 60 * 1000,
    });
}
