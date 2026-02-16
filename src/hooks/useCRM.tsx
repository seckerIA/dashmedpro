import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  CRMContact,
  CRMDeal,
  CRMActivity,
  CRMDealWithContact,
} from '@/types/crm';
import { useAuth } from './useAuth';
import { useUserProfile } from './useUserProfile';
import { useSecretaryDoctors } from './useSecretaryDoctors';
import { supabaseQueryWithTimeout } from '@/utils/supabaseQuery';

// Fetch contacts
const fetchContacts = async (
  userId: string,
  fetchAll: boolean = false,
  signal?: AbortSignal,
  doctorIds?: string[]
): Promise<CRMContact[]> => {
  // Se fetchAll=true, busca todos sem filtro de user_id
  if (!fetchAll && !userId && (!doctorIds || doctorIds.length === 0)) return [];

  let queryPromise = supabase.from('crm_contacts').select('*');

  // Apenas aplica filtro de user_id se NÃO for fetchAll
  if (!fetchAll) {
    if (doctorIds && doctorIds.length > 0) {
      queryPromise = (queryPromise as any).in('user_id', [userId, ...doctorIds]);
    } else if (userId) {
      queryPromise = (queryPromise as any).eq('user_id', userId);
    }
  }

  // Ordenar por nome alfabeticamente
  const { data, error } = await supabaseQueryWithTimeout(
    (queryPromise as any).order('full_name', { ascending: true }).limit(1000),
    30000,
    signal
  );
  if (error) throw new Error(`Erro ao buscar contatos: ${error.message}`);
  return (data as CRMContact[]) || [];
};

// Fetch deals with contacts
const fetchDeals = async (
  userId: string,
  viewAsUserIds?: string[],
  signal?: AbortSignal,
  doctorIds?: string[],
  fetchAll?: boolean
): Promise<CRMDealWithContact[]> => {
  const shouldFilterByUser = !fetchAll && (!viewAsUserIds || viewAsUserIds.length === 0);

  let orCondition = '';

  if (viewAsUserIds && viewAsUserIds.length > 0) {
    const validIds = viewAsUserIds.filter(Boolean);
    const idsString = `(${validIds.join(',')})`;
    orCondition = `user_id.in.${idsString},assigned_to.in.${idsString}`;
  } else if (!fetchAll) {
    // Comportamento restrito (apenas próprios + doctors vinculados se houver)
    const targetUserIds = doctorIds && doctorIds.length > 0 ? [userId, ...doctorIds] : [userId];
    const validIds = targetUserIds.filter(Boolean);
    const idsString = `(${validIds.join(',')})`;
    orCondition = `user_id.in.${idsString},assigned_to.in.${idsString}`;
  }

  // Removido 'service' e 'service_value' do select pois estão causando erro 400 no banco (colunas inexistentes)
  // Usando FK explícita para evitar ambiguidade (crm_deals_contact_id_fkey)
  const queryPromise = supabase
    .from('crm_deals')
    .select(`*, contact:crm_contacts!crm_deals_contact_id_fkey(id, full_name, email, phone, company)`);

  // Se tivermos uma condição OR (filtro de usuário), aplicamos. Se não, traz TUDO (respeitando RLS)
  if (orCondition) {
    (queryPromise as any).or(orCondition);
  }

  const { data, error } = await supabaseQueryWithTimeout(
    (queryPromise as any).order('position', { ascending: true }).limit(500),
    30000,
    signal
  );

  if (error) {
    // Ignorar AbortError - é comportamento normal de navegação/remontagem
    if (error.message?.includes('AbortError') || error.code === '20') {
      return []; // Retorna vazio silenciosamente
    }
    console.error('❌ [useCRM] Erro ao buscar deals:', error.message || error);
    // Fallback absoluto sem subquery
    // Se não tiver orCondition, é fetchAll -> sem filtro .or()
    let fallbackQuery = supabase.from('crm_deals').select('*');
    if (orCondition) {
      fallbackQuery = (fallbackQuery as any).or(orCondition);
    }

    const fallback = await supabaseQueryWithTimeout(fallbackQuery.limit(500) as any, 30000, signal);
    if (fallback.error) throw new Error(`Erro ao buscar deals: ${fallback.error.message}`);
    return (fallback.data || []) as CRMDealWithContact[];
  }

  const dealsData = data as any[];
  if (dealsData?.length > 0) {
    const profileIds = [...new Set([...dealsData.map(d => d.user_id), ...dealsData.map(d => d.assigned_to)].filter(Boolean))];
    if (profileIds.length > 0) {
      const { data: profiles } = await (supabase.from('profiles').select('id, full_name, email').in('id', profileIds) as any);
      const profileMap = new Map((profiles || []).map((p: any) => [p.id, p]));
      return dealsData.map(deal => ({
        ...deal,
        owner_profile: profileMap.get(deal.user_id) || null,
        assigned_to_profile: profileMap.get(deal.assigned_to) || null
      })) as CRMDealWithContact[];
    }
  }
  return (dealsData || []).map(deal => ({ ...deal, owner_profile: null, assigned_to_profile: null })) as CRMDealWithContact[];
};

const createRecord = async (table: string, payload: any) => {
  console.log(`📥 [createRecord] Inserindo em ${table}:`, payload);

  const insertPromise = (supabase.from(table as any).insert(payload) as any).select().single();

  // Timeout de 60 segundos para evitar travamento (aumentado devido a fila do navegador)
  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error(`Timeout ao inserir em ${table} (60s) - Fila do navegador possivelmente cheia`)), 60000)
  );

  let result: any;
  try {
    result = await Promise.race([insertPromise, timeoutPromise]);
  } catch (err) {
    console.error(`❌ [createRecord] Exceção fatal no Promise.race para ${table}:`, err);
    throw err;
  }

  const { data, error } = result as any;

  if (error) {
    console.error(`❌ [createRecord] Erro retornado pelo Supabase em ${table}:`, error);
    throw error;
  }
  console.log(`✅ [createRecord] Inserido com sucesso em ${table}:`, data);
  return data;
};

const updateRecord = async (table: string, id: string, payload: any) => {
  console.log(`📝 [updateRecord] Atualizando ${table} id=${id}:`, payload);

  const updatePromise = (supabase.from(table as any).update(payload).eq('id', id) as any).select().single();

  // Timeout de 60 segundos
  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error(`Timeout ao atualizar ${table} (60s)`)), 60000)
  );

  const { data, error } = await Promise.race([updatePromise, timeoutPromise]) as any;

  if (error) {
    console.error(`❌ [updateRecord] Erro ao atualizar ${table}:`, error);
    throw error;
  }
  console.log(`✅ [updateRecord] Atualizado com sucesso ${table}:`, data);
  return data;
};

const deleteRecord = async (table: string, id: string) => {
  console.log(`🗑️ [deleteRecord] Deletando ${table} id=${id}`);

  const deletePromise = supabase.from(table as any).delete().eq('id', id);

  // Timeout de 60 segundos
  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error(`Timeout ao deletar ${table} (60s)`)), 60000)
  );

  const { error } = await Promise.race([deletePromise, timeoutPromise]) as any;

  if (error) {
    console.error(`❌ [deleteRecord] Erro ao deletar ${table}:`, error);
    throw error;
  }
  console.log(`✅ [deleteRecord] Deletado com sucesso ${table} id=${id}`);
};

export function useCRM(viewAsUserIds?: string[], fetchAllContacts: boolean = false) {
  const { user, loading } = useAuth();
  const { profile, isSecretaria, isLoading: isLoadingProfile } = useUserProfile();
  const { doctorIds, isLoading: isLoadingDoctors } = useSecretaryDoctors();
  const queryClient = useQueryClient();

  // Se for secretaria, passamos doctorIds, mas AGORA vamos usar fetchAll=true também
  const doctorIdsToUse = isSecretaria ? doctorIds : [];

  // Check permission to view all
  const canViewAll = profile?.role === 'admin' || profile?.role === 'dono' || isSecretaria;

  const { data: contacts = [], isLoading: isLoadingContacts, refetch: refetchContacts } = useQuery({
    queryKey: ['crm-contacts', user?.id, fetchAllContacts, doctorIdsToUse],
    queryFn: ({ signal }) => fetchContacts(user?.id || '', fetchAllContacts, signal, doctorIdsToUse),
    enabled: (!!user?.id && !loading) || fetchAllContacts || doctorIdsToUse.length > 0,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  const { data: deals = [], isLoading: isLoadingDeals } = useQuery({
    queryKey: ['crm-deals', user?.id, viewAsUserIds?.join(','), doctorIdsToUse, canViewAll],
    queryFn: ({ signal }) => fetchDeals(user?.id || '', viewAsUserIds, signal, doctorIdsToUse, canViewAll),
    enabled: (!!user?.id && !loading) || doctorIdsToUse.length > 0,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  const createContactMutation = useMutation({
    mutationFn: (data: any) => {
      const payload = {
        ...data,
        user_id: user?.id,
        organization_id: profile?.organization_id
      };
      console.log('🚀 useCRM - Executando createContactMutation com payload:', payload);
      return createRecord('crm_contacts', payload);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['crm-contacts'] }),
    onError: (error) => console.error('❌ createContactMutation error:', error),
  });

  const createDealMutation = useMutation({
    mutationFn: (data: any) => {
      console.log('🚀 useCRM - Executando createDealMutation com payload:', data);
      return createRecord('crm_deals', {
        ...data,
        user_id: user?.id,
        organization_id: profile?.organization_id
      });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['crm-deals'] }),
    onError: (error) => console.error('❌ createDealMutation error:', error),
  });

  const updateDealMutation = useMutation({
    mutationFn: ({ dealId, data }: { dealId: string; data: any }) => updateRecord('crm_deals', dealId, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['crm-deals'] }),
  });

  const updateContactMutation = useMutation({
    mutationFn: ({ contactId, data }: { contactId: string; data: any }) => updateRecord('crm_contacts', contactId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crm-contacts'] });
      queryClient.invalidateQueries({ queryKey: ['crm-deals'] });
    },
  });

  const deleteDealMutation = useMutation({
    mutationFn: async (id: string) => {
      if (user?.id && profile?.role !== 'admin' && profile?.role !== 'dono') {
        const { data: deal } = await (supabase.from('crm_deals').select('user_id').eq('id', id) as any).single();
        if (deal && deal.user_id !== user.id) throw new Error('Sem permissão.');
      }
      return deleteRecord('crm_deals', id);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['crm-deals'] }),
  });

  const convertWhatsAppToDeal = async ({
    conversationId,
    contactName,
    phoneNumber,
    leadStatus,
    detectedProcedure,
    value,
  }: any) => {
    if (!user?.id) throw new Error('Auth error');
    const normalizedPhone = phoneNumber.replace(/\D/g, '');
    let contact: any = null;
    const { data: existing } = await (supabase.from('crm_contacts').select('*').or(`phone.ilike.%${normalizedPhone}%,phone.ilike.%${phoneNumber}%`).limit(1) as any);

    if (existing?.length > 0) {
      contact = existing[0];
    } else {
      contact = await createRecord('crm_contacts', {
        user_id: user.id,
        organization_id: profile?.organization_id,
        full_name: contactName || `WhatsApp ${phoneNumber}`,
        phone: phoneNumber
      });
    }

    const { data: existingDeals } = await ((supabase.from('crm_deals' as any) as any).select('id').eq('contact_id', contact.id).not('stage', 'in', '("fechado_ganho","fechado_perdido")').limit(1));

    let deal: any;
    const targetStage = leadStatus === 'convertido' ? 'agendado' : 'lead_novo';

    if (existingDeals?.length > 0) {
      deal = await updateRecord('crm_deals', existingDeals[0].id, { stage: targetStage, value: value || undefined });
    } else {
      deal = await createRecord('crm_deals', {
        user_id: user.id,
        organization_id: profile?.organization_id,
        contact_id: contact.id,
        title: contactName || `Lead WhatsApp ${phoneNumber}`,
        stage: targetStage,
        value: value || null
      });
    }

    await (supabase.from('whatsapp_conversation_analysis' as any).update({ deal_created: true, deal_id: deal.id, contact_created: true, contact_id: contact.id }) as any).eq('conversation_id', conversationId);

    queryClient.invalidateQueries({ queryKey: ['crm-deals'] });
    queryClient.invalidateQueries({ queryKey: ['crm-contacts'] });
    return { contact, deal };
  };

  return {
    contacts,
    deals,
    isLoading: isLoadingContacts || isLoadingDeals || isLoadingProfile,
    isLoadingContacts,
    refetchContacts,
    createContact: createContactMutation.mutateAsync,
    createDeal: createDealMutation.mutateAsync,
    updateDeal: updateDealMutation.mutateAsync,
    updateContact: updateContactMutation.mutateAsync,
    deleteDeal: deleteDealMutation.mutateAsync,
    convertWhatsAppToDeal,
  };
}
