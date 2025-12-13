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
  CRMContactWithDeals
} from '@/types/crm';
import { useAuth } from './useAuth';

// Fetch contacts
const fetchContacts = async (userId: string): Promise<CRMContact[]> => {
  const { data, error } = await supabase
    .from('crm_contacts')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(`Erro ao buscar contatos: ${error.message}`);
  return data || [];
};

// Fetch deals with contacts
const fetchDeals = async (userId: string, viewAsUserIds?: string[]): Promise<CRMDealWithContact[]> => {
  // Se viewAsUserIds é fornecido, buscar deals desses usuários, senão do userId atual
  const targetUserIds = viewAsUserIds && viewAsUserIds.length > 0 ? viewAsUserIds : [userId];
  
  // Criar condições OR para cada usuário (user_id ou assigned_to)
  const orConditions = targetUserIds
    .map(id => `user_id.eq.${id},assigned_to.eq.${id}`)
    .join(',');
  
  const { data, error } = await supabase
    .from('crm_deals')
    .select(`
      *,
      contact:crm_contacts(*)
    `)
    .or(orConditions)
    .order('position', { ascending: true });

  if (error) throw new Error(`Erro ao buscar deals: ${error.message}`);
  
  // Fetch user profiles for deal owners (para mostrar badge no card)
  const userIds = [...new Set(data?.map(d => d.user_id).filter(Boolean) || [])];
  
  // Fetch assigned profiles separately if needed
  if (data) {
    const assignedToIds = data
      .map(d => d.assigned_to)
      .filter((id): id is string => id !== null && id !== undefined);
    
    // Buscar todos os profiles necessários (owners + assigned)
    const allProfileIds = [...new Set([...userIds, ...assignedToIds])];
    
    if (allProfileIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .in('id', allProfileIds);
      
      // Merge profiles with deals (adicionar owner_profile e assigned_to_profile)
      return data.map(deal => ({
        ...deal,
        owner_profile: profiles?.find(p => p.id === deal.user_id) || null,
        assigned_to_profile: profiles?.find(p => p.id === deal.assigned_to) || null
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

  const { data, error } = await query.order('created_at', { ascending: false });

  if (error) throw new Error(`Erro ao buscar atividades: ${error.message}`);
  return data || [];
};

// Create contact
const createContact = async (contactData: CRMContactInsert): Promise<CRMContact> => {
  const { data, error } = await supabase
    .from('crm_contacts')
    .insert(contactData)
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

// Update contact
const updateContact = async ({ contactId, data }: { contactId: string; data: Partial<CRMContact> }): Promise<CRMContact> => {
  const { data: updatedContact, error } = await supabase
    .from('crm_contacts')
    .update(data)
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
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Queries
  const {
    data: contacts = [],
    isLoading: isLoadingContacts,
  } = useQuery({
    queryKey: ['crm-contacts', user?.id],
    queryFn: () => fetchContacts(user?.id || ''),
    enabled: !!user?.id,
  });

  const {
    data: deals = [],
    isLoading: isLoadingDeals,
  } = useQuery({
    queryKey: ['crm-deals', user?.id, viewAsUserIds?.join(',')],
    queryFn: () => fetchDeals(user?.id || '', viewAsUserIds),
    enabled: !!user?.id,
  });

  const {
    data: activities = [],
    isLoading: isLoadingActivities,
  } = useQuery({
    queryKey: ['crm-activities', user?.id],
    queryFn: () => fetchActivities(user?.id || ''),
    enabled: !!user?.id,
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
    },
  });

  const updateContactMutation = useMutation({
    mutationFn: updateContact,
    onSuccess: () => {
      // Invalidar e refazer as queries para garantir que os dados sejam atualizados
      queryClient.invalidateQueries({ queryKey: ['crm-contacts', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['crm-deals', user?.id] });
      // Forçar refetch imediato dos deals para atualizar os cards
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
    // Data
    contacts,
    deals,
    activities,

    // Loading states
    isLoadingContacts,
    isLoadingDeals,
    isLoadingActivities,
    isLoading: isLoadingContacts || isLoadingDeals || isLoadingActivities,

    // Mutations
    createContact: createContactMutation.mutateAsync,
    createDeal: createDealMutation.mutateAsync,
    createActivity: createActivityMutation.mutateAsync,
    updateDeal: updateDealMutation.mutateAsync,
    updateContact: updateContactMutation.mutateAsync,
    deleteContact: deleteContactMutation.mutateAsync,
    deleteDeal: deleteDealMutation.mutateAsync,

    // Mutation states
    isCreatingContact: createContactMutation.isPending,
    isCreatingDeal: createDealMutation.isPending,
    isCreatingActivity: createActivityMutation.isPending,
    isUpdatingDeal: updateDealMutation.isPending,
    isUpdatingContact: updateContactMutation.isPending,
    isDeletingContact: deleteContactMutation.isPending,
    isDeletingDeal: deleteDealMutation.isPending,
  };
}
