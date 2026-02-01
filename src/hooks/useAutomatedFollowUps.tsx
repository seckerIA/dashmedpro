import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/components/ui/use-toast';
import type {
  FollowUpTemplate,
  FollowUpTemplateInsert,
  FollowUpTemplateUpdate,
  FollowUpScheduled,
  FollowUpScheduledInsert,
  FollowUpScheduledUpdate,
  FollowUpScheduledWithRelations,
  FollowUpResponse,
  FollowUpResponseInsert,
  FollowUpResponseWithRelations,
  NPSCalculation,
  FollowUpDashboardMetrics,
} from '@/types/followUp';
import { useSecretaryDoctors } from './useSecretaryDoctors';

const FOLLOWUP_TEMPLATES_KEY = 'followup-templates';
const FOLLOWUP_SCHEDULED_KEY = 'followup-scheduled';
const FOLLOWUP_RESPONSES_KEY = 'followup-responses';
const FOLLOWUP_METRICS_KEY = 'followup-metrics';

export function useAutomatedFollowUps() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { doctorIds } = useSecretaryDoctors();

  const userIds = user ? [user.id, ...doctorIds] : [];

  // =====================================================
  // TEMPLATES
  // =====================================================

  const templatesQuery = useQuery({
    queryKey: [FOLLOWUP_TEMPLATES_KEY, userIds],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('followup_templates')
        .select('*')
        .in('user_id', userIds)
        .order('trigger_type', { ascending: true });

      if (error) throw error;
      return data as FollowUpTemplate[];
    },
    enabled: !!user,
  });

  const createTemplateMutation = useMutation({
    mutationFn: async (template: FollowUpTemplateInsert) => {
      const { data, error } = await supabase
        .from('followup_templates')
        .insert({ ...template, user_id: user!.id })
        .select()
        .single();

      if (error) throw error;
      return data as FollowUpTemplate;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [FOLLOWUP_TEMPLATES_KEY] });
      toast({ title: 'Template criado com sucesso!' });
    },
    onError: (error: Error) => {
      toast({ title: 'Erro ao criar template', description: error.message, variant: 'destructive' });
    },
  });

  const updateTemplateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: FollowUpTemplateUpdate }) => {
      const { data, error } = await supabase
        .from('followup_templates')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as FollowUpTemplate;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [FOLLOWUP_TEMPLATES_KEY] });
      toast({ title: 'Template atualizado com sucesso!' });
    },
    onError: (error: Error) => {
      toast({ title: 'Erro ao atualizar template', description: error.message, variant: 'destructive' });
    },
  });

  const deleteTemplateMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('followup_templates').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [FOLLOWUP_TEMPLATES_KEY] });
      toast({ title: 'Template excluído com sucesso!' });
    },
    onError: (error: Error) => {
      toast({ title: 'Erro ao excluir template', description: error.message, variant: 'destructive' });
    },
  });

  // =====================================================
  // SCHEDULED FOLLOW-UPS
  // =====================================================

  const scheduledQuery = useQuery({
    queryKey: [FOLLOWUP_SCHEDULED_KEY, userIds],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('followup_scheduled')
        .select(`
          *,
          template:followup_templates(*),
          contact:crm_contacts(id, full_name, phone, email),
          appointment:medical_appointments(id, start_time, end_time, status),
          response:followup_responses(*)
        `)
        .in('user_id', userIds)
        .order('scheduled_for', { ascending: false })
        .limit(200);

      if (error) throw error;
      return data as unknown as FollowUpScheduledWithRelations[];
    },
    enabled: !!user,
  });

  const createScheduledMutation = useMutation({
    mutationFn: async (followup: FollowUpScheduledInsert) => {
      const { data, error } = await supabase
        .from('followup_scheduled')
        .insert({ ...followup, user_id: user!.id })
        .select()
        .single();

      if (error) throw error;
      return data as FollowUpScheduled;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [FOLLOWUP_SCHEDULED_KEY] });
      toast({ title: 'Follow-up agendado com sucesso!' });
    },
    onError: (error: Error) => {
      toast({ title: 'Erro ao agendar follow-up', description: error.message, variant: 'destructive' });
    },
  });

  const updateScheduledMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: FollowUpScheduledUpdate }) => {
      const { data, error } = await supabase
        .from('followup_scheduled')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as FollowUpScheduled;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [FOLLOWUP_SCHEDULED_KEY] });
      toast({ title: 'Follow-up atualizado!' });
    },
    onError: (error: Error) => {
      toast({ title: 'Erro ao atualizar follow-up', description: error.message, variant: 'destructive' });
    },
  });

  const cancelScheduledMutation = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from('followup_scheduled')
        .update({ status: 'cancelled' })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [FOLLOWUP_SCHEDULED_KEY] });
      toast({ title: 'Follow-up cancelado!' });
    },
    onError: (error: Error) => {
      toast({ title: 'Erro ao cancelar follow-up', description: error.message, variant: 'destructive' });
    },
  });

  // =====================================================
  // RESPONSES
  // =====================================================

  const responsesQuery = useQuery({
    queryKey: [FOLLOWUP_RESPONSES_KEY, userIds],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('followup_responses')
        .select(`
          *,
          followup:followup_scheduled!inner(
            *,
            template:followup_templates(*),
            contact:crm_contacts(id, full_name, phone),
            appointment:medical_appointments(id, start_time, end_time, status)
          )
        `)
        .in('user_id', userIds)
        .order('responded_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      return data as unknown as FollowUpResponseWithRelations[];
    },
    enabled: !!user,
  });

  const createResponseMutation = useMutation({
    mutationFn: async (response: FollowUpResponseInsert) => {
      const { data, error } = await supabase
        .from('followup_responses')
        .insert({ ...response, user_id: user!.id })
        .select()
        .single();

      if (error) throw error;

      // Atualizar follow-up para 'responded'
      await supabase
        .from('followup_scheduled')
        .update({ status: 'responded' })
        .eq('id', response.followup_id);

      return data as FollowUpResponse;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [FOLLOWUP_RESPONSES_KEY] });
      queryClient.invalidateQueries({ queryKey: [FOLLOWUP_SCHEDULED_KEY] });
      queryClient.invalidateQueries({ queryKey: [FOLLOWUP_METRICS_KEY] });
      toast({ title: 'Resposta registrada!' });
    },
    onError: (error: Error) => {
      toast({ title: 'Erro ao registrar resposta', description: error.message, variant: 'destructive' });
    },
  });

  // =====================================================
  // METRICS & NPS
  // =====================================================

  const npsQuery = useQuery({
    queryKey: [FOLLOWUP_METRICS_KEY, 'nps', user?.id],
    queryFn: async () => {
      const startDate = new Date();
      startDate.setDate(1); // Primeiro dia do mês
      const endDate = new Date();

      const { data, error } = await supabase.rpc('calculate_nps', {
        p_user_id: user!.id,
        p_start_date: startDate.toISOString(),
        p_end_date: endDate.toISOString(),
      });

      if (error) throw error;
      return data[0] as NPSCalculation;
    },
    enabled: !!user,
  });

  const dashboardMetricsQuery = useQuery({
    queryKey: [FOLLOWUP_METRICS_KEY, 'dashboard', userIds],
    queryFn: async () => {
      const startDate = new Date();
      startDate.setDate(1);
      const endDate = new Date();

      // NPS
      const { data: npsData } = await supabase.rpc('calculate_nps', {
        p_user_id: user!.id,
        p_start_date: startDate.toISOString(),
        p_end_date: endDate.toISOString(),
      });

      // CSAT Average
      const { data: csatData } = await supabase
        .from('followup_responses')
        .select('csat_score')
        .in('user_id', userIds)
        .gte('responded_at', startDate.toISOString())
        .lte('responded_at', endDate.toISOString())
        .not('csat_score', 'is', null);

      const csatAvg = csatData && csatData.length > 0
        ? csatData.reduce((acc, r) => acc + (r.csat_score || 0), 0) / csatData.length
        : 0;

      // Counts
      const { count: totalSent } = await supabase
        .from('followup_scheduled')
        .select('*', { count: 'exact', head: true })
        .in('user_id', userIds)
        .in('status', ['sent', 'responded']);

      const { count: totalResponded } = await supabase
        .from('followup_scheduled')
        .select('*', { count: 'exact', head: true })
        .in('user_id', userIds)
        .eq('status', 'responded');

      const { count: pendingCount } = await supabase
        .from('followup_scheduled')
        .select('*', { count: 'exact', head: true })
        .in('user_id', userIds)
        .eq('status', 'pending');

      // Recent responses
      const { data: recentResponses } = await supabase
        .from('followup_responses')
        .select(`
          *,
          contact:crm_contacts(id, full_name, phone)
        `)
        .in('user_id', userIds)
        .order('responded_at', { ascending: false })
        .limit(10);

      const responseRate = totalSent && totalSent > 0
        ? ((totalResponded || 0) / totalSent) * 100
        : 0;

      return {
        nps: npsData?.[0] || { nps_score: 0, promoters: 0, passives: 0, detractors: 0, total_responses: 0 },
        csat_average: csatAvg,
        total_sent: totalSent || 0,
        total_responded: totalResponded || 0,
        response_rate: responseRate,
        pending_count: pendingCount || 0,
        recent_responses: (recentResponses || []) as FollowUpResponseWithRelations[],
      } as FollowUpDashboardMetrics;
    },
    enabled: !!user,
  });

  // =====================================================
  // HELPER: Criar templates padrão
  // =====================================================

  const createDefaultTemplatesMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.rpc('create_default_followup_templates', {
        p_user_id: user!.id,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [FOLLOWUP_TEMPLATES_KEY] });
      toast({ title: 'Templates padrão criados com sucesso!', description: '3 templates foram adicionados à sua conta.' });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao criar templates padrão',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  return {
    // Templates
    templates: templatesQuery.data || [],
    templatesLoading: templatesQuery.isLoading,
    createTemplate: createTemplateMutation.mutateAsync,
    updateTemplate: updateTemplateMutation.mutateAsync,
    deleteTemplate: deleteTemplateMutation.mutateAsync,
    createDefaultTemplates: createDefaultTemplatesMutation.mutateAsync,

    // Scheduled
    scheduled: scheduledQuery.data || [],
    scheduledLoading: scheduledQuery.isLoading,
    createScheduled: createScheduledMutation.mutateAsync,
    updateScheduled: updateScheduledMutation.mutateAsync,
    cancelScheduled: cancelScheduledMutation.mutateAsync,

    // Responses
    responses: responsesQuery.data || [],
    responsesLoading: responsesQuery.isLoading,
    createResponse: createResponseMutation.mutateAsync,

    // Metrics
    nps: npsQuery.data,
    npsLoading: npsQuery.isLoading,
    dashboardMetrics: dashboardMetricsQuery.data,
    metricsLoading: dashboardMetricsQuery.isLoading,
  };
}
