/**
 * Hook para gerenciar templates de mensagens WhatsApp
 * @module hooks/useWhatsAppTemplates
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/components/ui/use-toast';
import type {
  WhatsAppTemplate,
  WhatsAppTemplateCategory,
  WhatsAppTemplateComponent,
} from '@/types/whatsapp';

export const WHATSAPP_TEMPLATES_KEY = 'whatsapp-templates';

interface CreateTemplatePayload {
  name: string;
  language?: string;
  category: WhatsAppTemplateCategory;
  components: WhatsAppTemplateComponent[];
}

export function useWhatsAppTemplates() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // =========================================
  // Query: Listar templates do banco local
  // =========================================
  const templatesQuery = useQuery({
    queryKey: [WHATSAPP_TEMPLATES_KEY, user?.id],
    queryFn: async (): Promise<WhatsAppTemplate[]> => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('whatsapp_templates')
        .select('id, user_id, template_id, name, language, category, status, components, example_values, created_at, updated_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[useWhatsAppTemplates] Error:', error);
        throw error;
      }

      return (data || []) as WhatsAppTemplate[];
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
  });

  // =========================================
  // Mutation: Sincronizar templates da Meta
  // =========================================
  const syncMutation = useMutation({
    mutationFn: async () => {
      const response = await supabase.functions.invoke('whatsapp-manage-templates', {
        body: { action: 'sync' },
      });

      if (response.error) {
        throw new Error(response.error.message || 'Erro ao sincronizar templates');
      }

      if (!response.data?.success) {
        throw new Error(response.data?.error || 'Falha na sincronização');
      }

      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [WHATSAPP_TEMPLATES_KEY] });
      toast({
        title: 'Templates sincronizados',
        description: data.message || `${data.synced} templates atualizados.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao sincronizar',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // =========================================
  // Mutation: Criar template na Meta
  // =========================================
  const createMutation = useMutation({
    mutationFn: async (payload: CreateTemplatePayload) => {
      const response = await supabase.functions.invoke('whatsapp-manage-templates', {
        body: { action: 'create', ...payload },
      });

      if (response.error) {
        throw new Error(response.error.message || 'Erro ao criar template');
      }

      if (!response.data?.success) {
        throw new Error(response.data?.error || 'Falha ao criar template');
      }

      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [WHATSAPP_TEMPLATES_KEY] });
      toast({
        title: 'Template criado',
        description: data.message || 'Enviado para aprovação da Meta.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao criar template',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // =========================================
  // Mutation: Deletar template
  // =========================================
  const deleteMutation = useMutation({
    mutationFn: async ({ templateId, templateName }: { templateId: string; templateName: string }) => {
      const response = await supabase.functions.invoke('whatsapp-manage-templates', {
        body: { action: 'delete', template_id: templateId, template_name: templateName },
      });

      if (response.error) {
        throw new Error(response.error.message || 'Erro ao deletar template');
      }

      if (!response.data?.success) {
        throw new Error(response.data?.error || 'Falha ao deletar template');
      }

      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [WHATSAPP_TEMPLATES_KEY] });
      toast({ title: 'Template removido' });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao remover template',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  return {
    templates: templatesQuery.data || [],
    isLoading: templatesQuery.isLoading,
    error: templatesQuery.error,

    syncTemplates: syncMutation.mutateAsync,
    isSyncing: syncMutation.isPending,

    createTemplate: createMutation.mutateAsync,
    isCreating: createMutation.isPending,

    deleteTemplate: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,

    refetch: templatesQuery.refetch,
  };
}
