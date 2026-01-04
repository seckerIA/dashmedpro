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
  if (!userId && !fetchAll && (!doctorIds || doctorIds.length === 0)) return [];
  let queryPromise = supabase.from('crm_contacts').select('*');
  if (doctorIds && doctorIds.length > 0) {
    queryPromise = (queryPromise as any).in('user_id', [userId, ...doctorIds]);
  } else if (!fetchAll && userId) {
    queryPromise = (queryPromise as any).eq('user_id', userId);
  }
  const { data, error } = await supabaseQueryWithTimeout(
    (queryPromise as any).order('created_at', { ascending: false }).limit(1000),
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
  doctorIds?: string[]
): Promise<CRMDealWithContact[]> => {
  if (!userId && (!doctorIds || doctorIds.length === 0)) return [];
  const targetUserIds = doctorIds && doctorIds.length > 0 ? [userId, ...doctorIds] : (viewAsUserIds || [userId]);
  const validIds = targetUserIds.filter(id => id && typeof id === 'string');
  if (validIds.length === 0) return [];

  const idsString = `(${validIds.join(',')})`;
  const orCondition = `user_id.in.${idsString},assigned_to.in.${idsString}`;

  // Removido 'service' e 'service_value' do select pois estão causando erro 400 no banco (colunas inexistentes)
  const queryPromise = supabase
    .from('crm_deals')
    .select(`*, contact:crm_contacts(id, full_name, email, phone, company)`);

  const { data, error } = await supabaseQueryWithTimeout(
    (queryPromise as any).or(orCondition).order('position', { ascending: true }).limit(500),
    30000,
    signal
  );

  if (error) {
    console.error('❌ Erro no PostgREST crm_deals:', error);
    // Fallback absoluto sem subquery
    const fallback = await supabaseQueryWithTimeout(supabase.from('crm_deals').select('*').or(orCondition).limit(500) as any, 30000, signal);
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

// Mutations logic
const createRecord = async (table: string, payload: any) => {
  const { data, error } = await (supabase.from(table as any).insert(payload) as any).select().single();
  if (error) throw error;
  return data;
};

const updateRecord = async (table: string, id: string, payload: any) => {
  const { data, error } = await (supabase.from(table as any).update(payload).eq('id', id) as any).select().single();
  if (error) throw error;
  return data;
};

const deleteRecord = async (table: string, id: string) => {
  const { error } = await supabase.from(table as any).delete().eq('id', id);
  if (error) throw error;
};

export function useCRM(viewAsUserIds?: string[], fetchAllContacts: boolean = false) {
  const { user, loading } = useAuth();
  const { profile, isSecretaria, isLoading: isLoadingProfile } = useUserProfile();
  const { doctorIds, isLoading: isLoadingDoctors } = useSecretaryDoctors();
  const queryClient = useQueryClient();
  const doctorIdsToUse = isSecretaria ? doctorIds : [];

  const { data: contacts = [], isLoading: isLoadingContacts } = useQuery({
    queryKey: ['crm-contacts', user?.id, fetchAllContacts, doctorIdsToUse],
    queryFn: ({ signal }) => fetchContacts(user?.id || '', fetchAllContacts, signal, doctorIdsToUse),
    enabled: !!user?.id || fetchAllContacts || doctorIdsToUse.length > 0,
  });

  const { data: deals = [], isLoading: isLoadingDeals } = useQuery({
    queryKey: ['crm-deals', user?.id, viewAsUserIds?.join(','), doctorIdsToUse],
    queryFn: ({ signal }) => fetchDeals(user?.id || '', viewAsUserIds, signal, doctorIdsToUse),
    enabled: !!user?.id || doctorIdsToUse.length > 0,
  });

  const createContactMutation = useMutation({
    mutationFn: (data: any) => createRecord('crm_contacts', { ...data, user_id: user?.id }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['crm-contacts'] }),
  });

  const createDealMutation = useMutation({
    mutationFn: (data: any) => createRecord('crm_deals', { ...data, user_id: user?.id }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['crm-deals'] }),
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
      contact = await createRecord('crm_contacts', { user_id: user.id, full_name: contactName || `WhatsApp ${phoneNumber}`, phone: phoneNumber });
    }

    const { data: existingDeals } = await (supabase.from('crm_deals').select('id').eq('contact_id', contact.id).not('stage', 'in', '("fechado_ganho","fechado_perdido")').limit(1) as any);

    let deal: any;
    const targetStage = leadStatus === 'convertido' ? 'agendado' : 'lead_novo';

    if (existingDeals?.length > 0) {
      deal = await updateRecord('crm_deals', existingDeals[0].id, { stage: targetStage, value: value || undefined });
    } else {
      deal = await createRecord('crm_deals', { user_id: user.id, contact_id: contact.id, title: contactName || `Lead WhatsApp ${phoneNumber}`, stage: targetStage, value: value || null });
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
    createContact: createContactMutation.mutateAsync,
    createDeal: createDealMutation.mutateAsync,
    updateDeal: updateDealMutation.mutateAsync,
    updateContact: updateContactMutation.mutateAsync,
    deleteDeal: deleteDealMutation.mutateAsync,
    convertWhatsAppToDeal,
  };
}
