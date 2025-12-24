import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';
import { ReactivationCampaign, ReactivationMessage, EligibleContact, ReactivationCampaignStats } from '@/types/reactivation';

/**
 * Hook para gerenciar reativação de pacientes
 */
export function useReactivation() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Buscar campanhas de reativação
  const { data: campaigns, isLoading: isLoadingCampaigns } = useQuery({
    queryKey: ['reactivation-campaigns', user?.id],
    queryFn: async () => {
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('reactivation_campaigns')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as ReactivationCampaign[];
    },
    enabled: !!user,
  });

  // Buscar contatos elegíveis para reativação
  const getEligibleContacts = useQuery({
    queryKey: ['reactivation-eligible-contacts', user?.id],
    queryFn: async (inactiveMonths: number = 6) => {
      if (!user) throw new Error('User not authenticated');

      const cutoffDate = new Date();
      cutoffDate.setMonth(cutoffDate.getMonth() - inactiveMonths);

      const { data, error } = await supabase
        .from('crm_contacts')
        .select('id, full_name, phone, email, last_appointment_at, reactivation_last_sent_at')
        .eq('user_id', user.id)
        .or(`last_appointment_at.is.null,last_appointment_at.lt.${cutoffDate.toISOString()}`)
        .order('last_appointment_at', { ascending: true, nullsFirst: true });

      if (error) throw error;

      return (data || []).map((contact): EligibleContact => {
        const lastAppointment = contact.last_appointment_at 
          ? new Date(contact.last_appointment_at)
          : null;
        
        const monthsInactive = lastAppointment
          ? Math.floor((Date.now() - lastAppointment.getTime()) / (1000 * 60 * 60 * 24 * 30))
          : 999;

        return {
          contact_id: contact.id,
          full_name: contact.full_name || 'Sem nome',
          phone: contact.phone,
          email: contact.email,
          last_appointment_at: contact.last_appointment_at,
          months_inactive: monthsInactive,
          reactivation_last_sent_at: contact.reactivation_last_sent_at,
        };
      });
    },
    enabled: false, // Será habilitado quando necessário
  });

  // Enviar mensagem de reativação
  const sendReactivationMessage = useMutation({
    mutationFn: async ({
      campaignId,
      contactId,
      templateVariant,
      channel = 'whatsapp',
    }: {
      campaignId: string;
      contactId: string;
      templateVariant?: 'variant_a' | 'variant_b';
      channel?: 'whatsapp' | 'sms' | 'email';
    }) => {
      if (!user) throw new Error('User not authenticated');

      const session = await supabase.auth.getSession();
      const supabaseUrl = (await import('@/integrations/supabase/client')).SUPABASE_URL;
      const response = await fetch(`${supabaseUrl}/functions/v1/send-reactivation-message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.data.session?.access_token}`,
        },
        body: JSON.stringify({
          campaign_id: campaignId,
          contact_id: contactId,
          template_variant: templateVariant,
          channel: channel,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to send reactivation message');
      }

      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reactivation-messages'] });
      queryClient.invalidateQueries({ queryKey: ['reactivation-eligible-contacts'] });
    },
  });

  // Processar campanha de reativação
  const processCampaign = useMutation({
    mutationFn: async (campaignId?: string) => {
      if (!user) throw new Error('User not authenticated');

      const session = await supabase.auth.getSession();
      const supabaseUrl = (await import('@/integrations/supabase/client')).SUPABASE_URL;
      const response = await fetch(`${supabaseUrl}/functions/v1/process-reactivation-campaign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.data.session?.access_token}`,
        },
        body: JSON.stringify({
          campaign_id: campaignId,
          user_id: user.id,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to process campaign');
      }

      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reactivation-campaigns'] });
      queryClient.invalidateQueries({ queryKey: ['reactivation-messages'] });
      queryClient.invalidateQueries({ queryKey: ['reactivation-eligible-contacts'] });
    },
  });

  // Buscar estatísticas da campanha
  const getCampaignStats = useQuery({
    queryKey: ['reactivation-campaign-stats'],
    queryFn: async (campaignId: string) => {
      if (!user) throw new Error('User not authenticated');

      const { data: messages, error } = await supabase
        .from('reactivation_messages')
        .select('*')
        .eq('campaign_id', campaignId)
        .order('sent_at', { ascending: false });

      if (error) throw error;

      const totalSent = messages?.length || 0;
      const totalDelivered = messages?.filter(m => m.status === 'delivered' || m.status === 'read').length || 0;
      const totalRead = messages?.filter(m => m.status === 'read').length || 0;
      const totalResponses = messages?.filter(m => m.response_received).length || 0;
      const totalAppointments = messages?.filter(m => m.appointment_scheduled).length || 0;

      const variantA = messages?.filter(m => m.template_variant === 'variant_a') || [];
      const variantB = messages?.filter(m => m.template_variant === 'variant_b') || [];

      const stats: ReactivationCampaignStats = {
        campaign_id: campaignId,
        total_sent: totalSent,
        total_delivered: totalDelivered,
        total_read: totalRead,
        total_responses: totalResponses,
        total_appointments: totalAppointments,
        response_rate: totalSent > 0 ? (totalResponses / totalSent) * 100 : 0,
        appointment_rate: totalSent > 0 ? (totalAppointments / totalSent) * 100 : 0,
        variant_a_stats: {
          sent: variantA.length,
          responses: variantA.filter(m => m.response_received).length,
          appointments: variantA.filter(m => m.appointment_scheduled).length,
        },
        variant_b_stats: {
          sent: variantB.length,
          responses: variantB.filter(m => m.response_received).length,
          appointments: variantB.filter(m => m.appointment_scheduled).length,
        },
      };

      return stats;
    },
    enabled: false, // Será habilitado quando necessário
  });

  // Criar/atualizar campanha
  const upsertCampaign = useMutation({
    mutationFn: async (campaign: Partial<ReactivationCampaign> & { name: string }) => {
      if (!user) throw new Error('User not authenticated');

      // Preparar dados para inserção/atualização
      const isNewCampaign = !campaign.id || campaign.id === '';

      const campaignData: any = {
        name: campaign.name,
        inactive_period_months: campaign.inactive_period_months || 6,
        enabled: campaign.enabled !== undefined ? campaign.enabled : true,
        message_templates: campaign.message_templates || [],
        schedule_config: campaign.schedule_config || { preferred_hours: [], timezone: 'America/Sao_Paulo' },
        user_id: user.id,
        updated_at: new Date().toISOString(),
      };

      // Se for atualização, incluir ID
      if (!isNewCampaign) {
        campaignData.id = campaign.id;
      }

      let query;
      if (isNewCampaign) {
        query = supabase
          .from('reactivation_campaigns')
          .insert(campaignData)
          .select()
          .single();
      } else {
        const { id, ...updateData } = campaignData;
        query = supabase
          .from('reactivation_campaigns')
          .update(updateData)
          .eq('id', id)
          .eq('user_id', user.id)
          .select()
          .single();
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }
      
      return data as ReactivationCampaign;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reactivation-campaigns', user?.id] });
    },
  });

  // Buscar mensagens de uma campanha
  const getCampaignMessages = useQuery({
    queryKey: ['reactivation-messages'],
    queryFn: async (campaignId?: string) => {
      if (!user) throw new Error('User not authenticated');

      let query = supabase
        .from('reactivation_messages')
        .select('*')
        .order('sent_at', { ascending: false })
        .limit(100);

      if (campaignId) {
        query = query.eq('campaign_id', campaignId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as ReactivationMessage[];
    },
    enabled: false, // Será habilitado quando necessário
  });

  return {
    campaigns,
    isLoadingCampaigns,
    getEligibleContacts: (inactiveMonths?: number) => {
      return queryClient.fetchQuery({
        queryKey: ['reactivation-eligible-contacts', user?.id, inactiveMonths],
        queryFn: async () => {
          if (!user) throw new Error('User not authenticated');
          const months = inactiveMonths || 6;
          const cutoffDate = new Date();
          cutoffDate.setMonth(cutoffDate.getMonth() - months);

          const { data, error } = await supabase
            .from('crm_contacts')
            .select('id, full_name, phone, email, last_appointment_at, reactivation_last_sent_at')
            .eq('user_id', user.id)
            .or(`last_appointment_at.is.null,last_appointment_at.lt.${cutoffDate.toISOString()}`)
            .order('last_appointment_at', { ascending: true, nullsFirst: true });

          if (error) throw error;

          return (data || []).map((contact): EligibleContact => {
            const lastAppointment = contact.last_appointment_at 
              ? new Date(contact.last_appointment_at)
              : null;
            
            const monthsInactive = lastAppointment
              ? Math.floor((Date.now() - lastAppointment.getTime()) / (1000 * 60 * 60 * 24 * 30))
              : 999;

            return {
              contact_id: contact.id,
              full_name: contact.full_name || 'Sem nome',
              phone: contact.phone,
              email: contact.email,
              last_appointment_at: contact.last_appointment_at,
              months_inactive: monthsInactive,
              reactivation_last_sent_at: contact.reactivation_last_sent_at,
            };
          });
        },
      });
    },
    sendReactivationMessage: {
      mutate: (params: { campaignId: string; contactId: string; templateVariant?: 'variant_a' | 'variant_b'; channel?: 'whatsapp' | 'sms' | 'email' }) =>
        sendReactivationMessage.mutate(params),
      mutateAsync: (params: { campaignId: string; contactId: string; templateVariant?: 'variant_a' | 'variant_b'; channel?: 'whatsapp' | 'sms' | 'email' }) =>
        sendReactivationMessage.mutateAsync(params),
      isPending: sendReactivationMessage.isPending,
      error: sendReactivationMessage.error,
    },
    processCampaign: {
      mutate: (campaignId?: string) => processCampaign.mutate(campaignId),
      mutateAsync: (campaignId?: string) => processCampaign.mutateAsync(campaignId),
      isPending: processCampaign.isPending,
      error: processCampaign.error,
    },
    getCampaignStats: (campaignId: string) => {
      return queryClient.fetchQuery({
        queryKey: ['reactivation-campaign-stats', campaignId],
        queryFn: async () => {
          if (!user) throw new Error('User not authenticated');

          const { data: messages, error } = await supabase
            .from('reactivation_messages')
            .select('*')
            .eq('campaign_id', campaignId)
            .order('sent_at', { ascending: false });

          if (error) throw error;

          const totalSent = messages?.length || 0;
          const totalDelivered = messages?.filter(m => m.status === 'delivered' || m.status === 'read').length || 0;
          const totalRead = messages?.filter(m => m.status === 'read').length || 0;
          const totalResponses = messages?.filter(m => m.response_received).length || 0;
          const totalAppointments = messages?.filter(m => m.appointment_scheduled).length || 0;

          const variantA = messages?.filter(m => m.template_variant === 'variant_a') || [];
          const variantB = messages?.filter(m => m.template_variant === 'variant_b') || [];

          return {
            campaign_id: campaignId,
            total_sent: totalSent,
            total_delivered: totalDelivered,
            total_read: totalRead,
            total_responses: totalResponses,
            total_appointments: totalAppointments,
            response_rate: totalSent > 0 ? (totalResponses / totalSent) * 100 : 0,
            appointment_rate: totalSent > 0 ? (totalAppointments / totalSent) * 100 : 0,
            variant_a_stats: {
              sent: variantA.length,
              responses: variantA.filter(m => m.response_received).length,
              appointments: variantA.filter(m => m.appointment_scheduled).length,
            },
            variant_b_stats: {
              sent: variantB.length,
              responses: variantB.filter(m => m.response_received).length,
              appointments: variantB.filter(m => m.appointment_scheduled).length,
            },
          } as ReactivationCampaignStats;
        },
      });
    },
    upsertCampaign: {
      mutate: (campaign: Partial<ReactivationCampaign> & { name: string }) =>
        upsertCampaign.mutate(campaign),
      mutateAsync: (campaign: Partial<ReactivationCampaign> & { name: string }) =>
        upsertCampaign.mutateAsync(campaign),
      isPending: upsertCampaign.isPending,
      error: upsertCampaign.error,
    },
    getCampaignMessages: (campaignId?: string) => {
      return queryClient.fetchQuery({
        queryKey: ['reactivation-messages', campaignId],
        queryFn: async () => {
          if (!user) throw new Error('User not authenticated');

          let query = supabase
            .from('reactivation_messages')
            .select('*')
            .order('sent_at', { ascending: false })
            .limit(100);

          if (campaignId) {
            query = query.eq('campaign_id', campaignId);
          }

          const { data, error } = await query;

          if (error) throw error;
          return data as ReactivationMessage[];
        },
      });
    },
  };
}

