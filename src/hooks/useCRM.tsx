import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  CRMContact,
  CRMDeal,
  CRMActivity,
  CRMContactInsert,
  CRMDealInsert,
  CRMActivityInsert,
  CRMDealWithContact,
} from '@/types/crm';
import { useAuth } from './useAuth';
import { supabaseQueryWithTimeout } from '@/utils/supabaseQuery';

// Fetch contacts
const fetchContacts = async (userId: string, signal?: AbortSignal): Promise<CRMContact[]> => {
  if (!userId) return [];

  const queryPromise = supabase
    .from('crm_contacts')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1000);

  const { data, error } = await supabaseQueryWithTimeout(queryPromise, 30000, signal);

  if (error) throw new Error(`Erro ao buscar contatos: ${error.message}`);
  return data || [];
};

// Fetch deals with contacts
const fetchDeals = async (userId: string, viewAsUserIds?: string[], signal?: AbortSignal): Promise<CRMDealWithContact[]> => {
  if (!userId) return [];

  const targetUserIds = viewAsUserIds && viewAsUserIds.length > 0 ? viewAsUserIds : [userId];
  const orConditions = targetUserIds
    .map(id => `user_id.eq.${id},assigned_to.eq.${id}`)
    .join(',');

  const queryPromise = supabase
    .from('crm_deals')
    .select(`*, contact:crm_contacts(*)`)
    .or(orConditions)
    .order('position', { ascending: true })
    .limit(1000);

  const { data, error } = await supabaseQueryWithTimeout(queryPromise, 30000, signal);

  if (error) throw new Error(`Erro ao buscar deals: ${error.message}`);

  // Buscar profiles em batch
  if (data && data.length > 0) {
    const userIds = [...new Set(data.map(d => d.user_id).filter(Boolean))];
    const assignedToIds = [...new Set(data.map(d => d.assigned_to).filter((id): id is string => id !== null && id !== undefined))];
    const allProfileIds = [...new Set([...userIds, ...assignedToIds])];

    if (allProfileIds.length > 0) {
      const profilesQuery = supabase
        .from('profiles')
        .select('id, full_name, email')
        .in('id', allProfileIds);

      const profilesResult = await supabaseQueryWithTimeout(profilesQuery, 30000, signal);
      const profiles = profilesResult.data;
      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

      return data.map(deal => ({
        ...deal,
        owner_profile: deal.user_id ? (profileMap.get(deal.user_id) || null) : null,
        assigned_to_profile: deal.assigned_to ? (profileMap.get(deal.assigned_to) || null) : null
      }));
    }
  }

  return (data || []).map(deal => ({
    ...deal,
    owner_profile: null,
    assigned_to_profile: null
  }));
};

// Fetch activities
const fetchActivities = async (userId: string, contactId?: string): Promise<CRMActivity[]> => {
  let query = supabase
    .from('crm_activities')
    .select('*')
    .eq('user_id', userId);

  if (contactId) {
    query = query.eq('contact_id', contactId);
  }

  const { data, error } = await query
    .order('created_at', { ascending: false })
    .limit(500);

  if (error) throw new Error(`Erro ao buscar atividades: ${error.message}`);
  return data || [];
};

// Create contact
const createContact = async (contactData: CRMContactInsert): Promise<CRMContact> => {
  const insertData = { ...contactData };
  if (insertData.custom_fields && Array.isArray(insertData.custom_fields)) {
    insertData.custom_fields = {} as any;
  }

  const { data, error } = await supabase
    .from('crm_contacts')
    .insert(insertData)
    .select()
    .single();

  if (error) throw new Error(`Erro ao criar contato: ${error.message}`);
  return data;
};

// Create deal
const createDeal = async (dealData: CRMDealInsert): Promise<CRMDeal> => {
  const { data, error } = await supabase
    .from('crm_deals')
    .insert(dealData)
    .select()
    .single();

  if (error) throw new Error(`Erro ao criar deal: ${error.message}`);
  return data;
};

// Create activity
const createActivity = async (activityData: CRMActivityInsert): Promise<CRMActivity> => {
  const { data, error } = await supabase
    .from('crm_activities')
    .insert(activityData)
    .select()
    .single();

  if (error) throw new Error(`Erro ao criar atividade: ${error.message}`);
  return data;
};

// Update deal
const updateDeal = async ({ dealId, data }: { dealId: string; data: Partial<CRMDeal> }): Promise<CRMDeal> => {
  const { data: updatedDeal, error } = await supabase
    .from('crm_deals')
    .update(data)
    .eq('id', dealId)
    .select()
    .single();

  if (error) throw new Error(`Erro ao atualizar deal: ${error.message}`);
  return updatedDeal;
};

// Update multiple deals positions
const updateDealsPositions = async (updates: Array<{ id: string; position: number }>): Promise<void> => {
  const promises = updates.map(({ id, position }) =>
    supabase
      .from('crm_deals')
      .update({ position })
      .eq('id', id)
  );

  const results = await Promise.all(promises);
  const errors = results.filter(r => r.error);
  if (errors.length > 0) {
    throw new Error(`Erro ao atualizar posições: ${errors[0].error?.message}`);
  }
};

// Update contact
const updateContact = async ({ contactId, data }: { contactId: string; data: Partial<CRMContact> }): Promise<CRMContact> => {
  const updateData = { ...data };
  if (updateData.custom_fields && Array.isArray(updateData.custom_fields)) {
    updateData.custom_fields = {} as any;
  }

  const { data: updatedContact, error } = await supabase
    .from('crm_contacts')
    .update(updateData)
    .eq('id', contactId)
    .select()
    .single();

  if (error) throw new Error(`Erro ao atualizar contato: ${error.message}`);
  return updatedContact;
};

// Delete contact
const deleteContact = async (contactId: string): Promise<void> => {
  const { error } = await supabase
    .from('crm_contacts')
    .delete()
    .eq('id', contactId);

  if (error) throw new Error(`Erro ao excluir contato: ${error.message}`);
};

// Delete deal
const deleteDeal = async (dealId: string): Promise<void> => {
  const { error } = await supabase
    .from('crm_deals')
    .delete()
    .eq('id', dealId);

  if (error) throw new Error(`Erro ao excluir deal: ${error.message}`);
};

// Hook principal
export function useCRM(viewAsUserIds?: string[]) {
  const { user, loading } = useAuth();
  const queryClient = useQueryClient();

  const {
    data: contacts = [],
    isLoading: isLoadingContacts,
    refetch: refetchContacts,
  } = useQuery({
    queryKey: ['crm-contacts', user?.id],
    queryFn: async ({ signal }) => {
      if (!user?.id) return [];
      try {
        return await fetchContacts(user.id, signal);
      } catch (error) {
        console.error('Erro ao buscar contatos:', error);
        return [];
      }
    },
    enabled: !!user?.id && !loading,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    retry: 2,
    retryDelay: 1000,
  });

  const {
    data: deals = [],
    isLoading: isLoadingDeals,
  } = useQuery({
    queryKey: ['crm-deals', user?.id, viewAsUserIds?.join(',')],
    queryFn: async ({ signal }) => {
      if (!user?.id) return [];
      try {
        return await fetchDeals(user.id, viewAsUserIds, signal);
      } catch (error) {
        console.error('Erro ao buscar deals:', error);
        return [];
      }
    },
    enabled: !!user?.id && !loading,
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    retry: 2,
    retryDelay: 1000,
  });

  const {
    data: activities = [],
    isLoading: isLoadingActivities,
  } = useQuery({
    queryKey: ['crm-activities', user?.id],
    queryFn: () => fetchActivities(user?.id || ''),
    enabled: false,
    staleTime: 5 * 60 * 1000,
  });

  // Mutations
  const createContactMutation = useMutation({
    mutationFn: (contactData: Omit<CRMContactInsert, 'user_id'>) =>
      createContact({ ...contactData, user_id: user?.id || '' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crm-contacts', user?.id] });
    },
  });

  const createDealMutation = useMutation({
    mutationFn: (dealData: Omit<CRMDealInsert, 'user_id'>) =>
      createDeal({ ...dealData, user_id: user?.id || '' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crm-deals', user?.id] });
    },
  });

  const createActivityMutation = useMutation({
    mutationFn: (activityData: Omit<CRMActivityInsert, 'user_id'>) =>
      createActivity({ ...activityData, user_id: user?.id || '' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crm-activities', user?.id] });
    },
  });

  const updateDealMutation = useMutation({
    mutationFn: updateDeal,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crm-deals', user?.id] });
      queryClient.refetchQueries({ queryKey: ['crm-deals', user?.id] });
    },
  });

  const updateDealsPositionsMutation = useMutation({
    mutationFn: updateDealsPositions,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crm-deals', user?.id] });
      queryClient.refetchQueries({ queryKey: ['crm-deals', user?.id] });
    },
  });

  const updateContactMutation = useMutation({
    mutationFn: updateContact,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crm-contacts', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['crm-deals', user?.id] });
      queryClient.refetchQueries({ queryKey: ['crm-deals', user?.id] });
    },
  });

  const deleteContactMutation = useMutation({
    mutationFn: deleteContact,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crm-contacts', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['crm-deals', user?.id] });
    },
  });

  const deleteDealMutation = useMutation({
    mutationFn: deleteDeal,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crm-deals', user?.id] });
    },
  });

  return {
    contacts,
    deals,
    activities,
    isLoadingContacts,
    isLoadingDeals,
    isLoadingActivities,
    isLoading: isLoadingContacts || isLoadingDeals || isLoadingActivities,
    refetchContacts,
    createContact: createContactMutation.mutateAsync,
    createDeal: createDealMutation.mutateAsync,
    createActivity: createActivityMutation.mutateAsync,
    updateDeal: updateDealMutation.mutateAsync,
    updateDealsPositions: updateDealsPositionsMutation.mutateAsync,
    updateContact: updateContactMutation.mutateAsync,
    deleteContact: deleteContactMutation.mutateAsync,
    deleteDeal: deleteDealMutation.mutateAsync,
    isCreatingContact: createContactMutation.isPending,
    isCreatingDeal: createDealMutation.isPending,
    isCreatingActivity: createActivityMutation.isPending,
    isUpdatingDeal: updateDealMutation.isPending,
    isUpdatingContact: updateContactMutation.isPending,
    isDeletingContact: deleteContactMutation.isPending,
    isDeletingDeal: deleteDealMutation.isPending,
  };
}
