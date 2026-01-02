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
import { useUserProfile } from './useUserProfile';
import { useSecretaryDoctors } from './useSecretaryDoctors';
import { supabaseQueryWithTimeout } from '@/utils/supabaseQuery';

// Fetch contacts
const fetchContacts = async (
  userId: string,
  fetchAll: boolean = false,
  signal?: AbortSignal,
  doctorIds?: string[] // IDs dos médicos vinculados (para secretárias)
): Promise<CRMContact[]> => {
  if (!userId && !fetchAll && (!doctorIds || doctorIds.length === 0)) return [];

  let queryPromise = supabase
    .from('crm_contacts')
    .select('*');

  // Secretária vê contatos dos médicos vinculados
  if (doctorIds && doctorIds.length > 0) {
    queryPromise = queryPromise.in('user_id', doctorIds);
  } else if (!fetchAll && userId) {
    // Usuário normal vê apenas seus próprios contatos
    queryPromise = queryPromise.eq('user_id', userId);
  }
  // Se fetchAll for true, não aplica filtro (admin/dono)

  queryPromise = queryPromise
    .order('created_at', { ascending: false })
    .limit(1000);

  const { data, error } = await supabaseQueryWithTimeout(queryPromise as any, 30000, signal);

  if (error) throw new Error(`Erro ao buscar contatos: ${error.message}`);
  return (data as CRMContact[]) || [];
};

// Fetch deals with contacts
const fetchDeals = async (
  userId: string,
  viewAsUserIds?: string[],
  signal?: AbortSignal,
  doctorIds?: string[] // IDs dos médicos vinculados (para secretárias)
): Promise<CRMDealWithContact[]> => {
  if (!userId && (!doctorIds || doctorIds.length === 0)) return [];

  // Secretária vê deals dos médicos vinculados
  // Outros usuários veem seus próprios deals ou dos viewAsUserIds
  const targetUserIds = doctorIds && doctorIds.length > 0
    ? doctorIds
    : (viewAsUserIds && viewAsUserIds.length > 0 ? viewAsUserIds : [userId]);

  const orConditions = targetUserIds
    .map(id => `user_id.eq.${id},assigned_to.eq.${id}`)
    .join(',');

  const queryPromise = supabase
    .from('crm_deals')
    .select(`*, contact:crm_contacts(id, full_name, email, phone, company, service_value, custom_fields)`)
    .or(orConditions)
    .order('position', { ascending: true })
    .order('created_at', { ascending: false })
    .limit(500); // Reduzido de 1000 para 500 para melhor performance

  const { data, error } = await supabaseQueryWithTimeout(queryPromise as any, 30000, signal);

  if (error) throw new Error(`Erro ao buscar deals: ${error.message}`);

  const dealsData = data as any[];

  // Buscar profiles em batch
  if (dealsData && dealsData.length > 0) {
    const userIds = [...new Set(dealsData.map((d: any) => d.user_id).filter(Boolean))];
    const assignedToIds = [...new Set(dealsData.map((d: any) => d.assigned_to).filter((id): id is string => id !== null && id !== undefined))];
    const allProfileIds = [...new Set([...userIds, ...assignedToIds])];

    if (allProfileIds.length > 0) {
      const profilesQuery = supabase
        .from('profiles')
        .select('id, full_name, email')
        .in('id', allProfileIds);

      const profilesResult = await supabaseQueryWithTimeout(profilesQuery as any, 30000, signal);
      const profiles = profilesResult.data as any[];
      const profileMap = new Map(profiles?.map((p: any) => [p.id, p]) || []);

      return dealsData.map((deal: any) => ({
        ...deal,
        owner_profile: deal.user_id ? (profileMap.get(deal.user_id) || null) : null,
        assigned_to_profile: deal.assigned_to ? (profileMap.get(deal.assigned_to) || null) : null
      })) as CRMDealWithContact[];
    }
  }

  return (dealsData || []).map((deal: any) => ({
    ...deal,
    owner_profile: null,
    assigned_to_profile: null
  })) as CRMDealWithContact[];
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
  
  // Garantir que custom_fields seja um objeto válido (JSONB)
  if (insertData.custom_fields && Array.isArray(insertData.custom_fields)) {
    insertData.custom_fields = {} as any;
  }
  // Se custom_fields for null ou undefined, usar objeto vazio
  if (!insertData.custom_fields) {
    insertData.custom_fields = {} as any;
  }

  console.log('🔍 createContact - Dados antes do insert:', {
    insertData,
    custom_fields: insertData.custom_fields,
    custom_fields_type: typeof insertData.custom_fields,
  });

  // Usar supabase diretamente ao invés de supabaseQueryWithTimeout para evitar problemas com .single()
  const { data, error } = await supabase
    .from('crm_contacts')
    .insert(insertData)
    .select()
    .single();

  if (error) {
    console.error('❌ Erro ao criar contato:', error);
    throw new Error(`Erro ao criar contato: ${error.message}`);
  }
  
  if (!data) {
    console.error('❌ Nenhum dado retornado ao criar contato');
    throw new Error('Erro ao criar contato: nenhum dado retornado');
  }
  
  console.log('✅ Contato criado com sucesso:', data);
  return data as CRMContact;
};

// Create deal
const createDeal = async (dealData: CRMDealInsert): Promise<CRMDeal> => {
  const queryPromise = supabase
    .from('crm_deals')
    .insert(dealData)
    .select()
    .single();

  const { data, error } = await supabaseQueryWithTimeout(queryPromise as any, 30000);

  if (error) throw new Error(`Erro ao criar deal: ${error.message}`);
  if (!data) throw new Error('Erro ao criar deal: nenhum dado retornado');
  return data as CRMDeal;
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
const deleteDeal = async (dealId: string, userId?: string): Promise<void> => {
  console.log('🗑️ deleteDeal chamado:', { dealId, userId });
  
  // Se não tem userId, ainda tenta deletar (para casos onde a validação já foi feita)
  if (userId) {
    const { data: deal, error: fetchError } = await supabase
      .from('crm_deals')
      .select('id, user_id, assigned_to')
      .eq('id', dealId)
      .single();

    if (fetchError) {
      console.error('❌ Erro ao buscar deal para deleção:', fetchError);
      throw new Error(`Erro ao verificar permissão: ${fetchError.message}`);
    }

    if (!deal) {
      console.error('❌ Deal não encontrado:', dealId);
      throw new Error('Deal não encontrado');
    }

    console.log('🔍 Deal encontrado:', { dealId: deal.id, userId: deal.user_id, assignedTo: deal.assigned_to });

    // Verificar se o usuário tem permissão (é o dono ou admin/dono)
    const isOwner = deal.user_id === userId;
    const isAssigned = deal.assigned_to === userId;
    
    if (!isOwner && !isAssigned) {
      // Verificar se é admin/dono
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();
      
      if (profileError) {
        console.error('❌ Erro ao buscar perfil:', profileError);
        throw new Error(`Erro ao verificar permissão: ${profileError.message}`);
      }
      
      const isAdminOrDono = profile?.role === 'admin' || profile?.role === 'dono';
      console.log('🔐 Verificação de permissão:', { isOwner, isAssigned, role: profile?.role, isAdminOrDono });
      
      if (!isAdminOrDono) {
        throw new Error('Você não tem permissão para excluir este deal. Apenas o criador, responsável ou um administrador pode excluí-lo.');
      }
    }
  }

  // Tentar deletar
  console.log('✅ Tentando deletar deal:', dealId);
  const { error, data } = await supabase
    .from('crm_deals')
    .delete()
    .eq('id', dealId)
    .select();

  if (error) {
    console.error('❌ Erro ao deletar deal:', error);
    throw new Error(`Erro ao excluir deal: ${error.message}`);
  }

  // Verificar se realmente foi deletado
  if (!data || data.length === 0) {
    console.error('❌ Deal não foi deletado (nenhum dado retornado):', dealId);
    throw new Error('O deal não foi excluído. Verifique se você tem permissão para excluí-lo ou se o deal ainda existe.');
  }

  console.log('✅ Deal deletado com sucesso:', dealId);
};

// Hook principal
export function useCRM(viewAsUserIds?: string[], fetchAllContacts: boolean = false) {
  const { user, loading } = useAuth();
  const { isSecretaria, isLoading: isLoadingProfile } = useUserProfile();
  const { doctorIds, isLoading: isLoadingDoctors } = useSecretaryDoctors();
  const queryClient = useQueryClient();

  // Secretária usa lista de médicos vinculados para filtrar
  const doctorIdsToUse = isSecretaria ? doctorIds : [];

  const {
    data: contacts = [],
    isLoading: isLoadingContacts,
    refetch: refetchContacts,
  } = useQuery({
    queryKey: ['crm-contacts', user?.id, fetchAllContacts, doctorIdsToUse],
    queryFn: async ({ signal }) => {
      if (!user?.id && !fetchAllContacts && doctorIdsToUse.length === 0) return [];
      try {
        return await fetchContacts(
          user?.id || '',
          fetchAllContacts,
          signal,
          doctorIdsToUse.length > 0 ? doctorIdsToUse : undefined
        );
      } catch (error) {
        console.error('Erro ao buscar contatos:', error);
        return [];
      }
    },
    enabled: (!!user?.id || fetchAllContacts || doctorIdsToUse.length > 0) && !loading && (!isSecretaria || !isLoadingDoctors),
    staleTime: 5 * 60 * 1000, // 5 minutos - usar cache por mais tempo
    gcTime: 10 * 60 * 1000, // 10 minutos em cache
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false, // Não refetch ao reconectar - usar cache
    refetchInterval: false, // Não fazer refetch automático
    retry: 1, // Reduzir retries
    retryDelay: 2000,
  });

  const {
    data: deals = [],
    isLoading: isLoadingDeals,
  } = useQuery({
    queryKey: ['crm-deals', user?.id, viewAsUserIds?.join(','), doctorIdsToUse],
    queryFn: async ({ signal }) => {
      if (!user?.id && doctorIdsToUse.length === 0) return [];
      try {
        return await fetchDeals(
          user?.id || '',
          viewAsUserIds,
          signal,
          doctorIdsToUse.length > 0 ? doctorIdsToUse : undefined
        );
      } catch (error) {
        console.error('Erro ao buscar deals:', error);
        return [];
      }
    },
    enabled: (!!user?.id || doctorIdsToUse.length > 0) && !loading && (!isSecretaria || !isLoadingDoctors),
    staleTime: 10 * 60 * 1000, // 10 minutos - aumentar cache para melhor performance
    gcTime: 15 * 60 * 1000, // 15 minutos em cache
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false, // Não refetch ao reconectar - usar cache
    refetchInterval: false, // Não fazer refetch automático
    retry: 1, // Reduzir retries
    retryDelay: 2000,
    // Adicionar placeholderData para melhor UX durante loading
    placeholderData: (previousData) => previousData,
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
    onSuccess: (newContact) => {
      // Atualizar cache otimisticamente em vez de invalidar imediatamente
      if (user?.id) {
        queryClient.setQueryData<CRMContact[]>(
          ['crm-contacts', user.id],
          (oldData = []) => [newContact, ...oldData]
        );
      }
      // Invalidar de forma assíncrona e não bloqueante após um delay
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['crm-contacts', user?.id] }).catch(() => {
          // Ignorar erros de invalidação
        });
      }, 100);
    },
  });

  const createDealMutation = useMutation({
    mutationFn: (dealData: Omit<CRMDealInsert, 'user_id'>) =>
      createDeal({ ...dealData, user_id: user?.id || '' }),
    onSuccess: (newDeal) => {
      // Invalidar todas as queries de deals para garantir que apareça imediatamente
      // Usar queryKey prefix para invalidar todas as variações (com e sem viewAsUserIds)
      queryClient.invalidateQueries({ 
        queryKey: ['crm-deals'],
        exact: false 
      });
      
      // Também atualizar cache otimisticamente se possível
      if (user?.id) {
        const queryKey = ['crm-deals', user.id, viewAsUserIds?.join(',')];
        queryClient.setQueryData<CRMDealWithContact[]>(
          queryKey,
          (oldData = []) => {
            // Verificar se o deal já existe no cache (evitar duplicatas)
            const exists = oldData.some(d => d.id === newDeal.id);
            if (exists) return oldData;
            
            // Buscar o contato relacionado para incluir no deal
            const contact = contacts.find(c => c.id === newDeal.contact_id);
            const dealWithContact: CRMDealWithContact = {
              ...newDeal,
              contact: contact || null,
              owner_profile: null,
              assigned_to_profile: null,
            };
            return [dealWithContact, ...oldData];
          }
        );
      }
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
    onSuccess: (updatedDeal) => {
      // Invalidar todas as queries de deals para garantir atualização imediata
      queryClient.invalidateQueries({ 
        queryKey: ['crm-deals'],
        exact: false 
      });
      
      // Também atualizar cache otimisticamente se possível
      if (user?.id) {
        const queryKey = ['crm-deals', user.id, viewAsUserIds?.join(',')];
        queryClient.setQueryData<CRMDealWithContact[]>(
          queryKey,
          (oldData = []) =>
            oldData.map(deal =>
              deal.id === updatedDeal.id
                ? { ...deal, ...updatedDeal }
                : deal
            )
        );
      }
    },
  });

  const updateDealsPositionsMutation = useMutation({
    mutationFn: updateDealsPositions,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crm-deals', user?.id] });
    },
  });

  const updateContactMutation = useMutation({
    mutationFn: updateContact,
    onSuccess: (updatedContact) => {
      // Atualizar cache otimisticamente
      if (user?.id) {
        queryClient.setQueryData<CRMContact[]>(
          ['crm-contacts', user.id],
          (oldData = []) =>
            oldData.map(contact =>
              contact.id === updatedContact.id ? updatedContact : contact
            )
        );
      }
      // Invalidar de forma assíncrona e não bloqueante
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['crm-contacts', user?.id] }).catch(() => {});
        queryClient.invalidateQueries({ queryKey: ['crm-deals', user?.id] }).catch(() => {});
      }, 100);
    },
  });

  const deleteContactMutation = useMutation({
    mutationFn: deleteContact,
    onSuccess: (_, contactId) => {
      // Atualizar cache otimisticamente removendo o contato
      if (user?.id) {
        queryClient.setQueryData<CRMContact[]>(
          ['crm-contacts', user.id],
          (oldData = []) => oldData.filter(contact => contact.id !== contactId)
        );
      }
      // Invalidar de forma assíncrona e não bloqueante
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['crm-contacts', user?.id] }).catch(() => {});
        queryClient.invalidateQueries({ queryKey: ['crm-deals', user?.id] }).catch(() => {});
      }, 100);
    },
  });

  const deleteDealMutation = useMutation({
    mutationFn: (dealId: string) => deleteDeal(dealId, user?.id),
    onSuccess: (_, dealId) => {
      // Invalidar todas as queries de deals para garantir atualização imediata
      queryClient.invalidateQueries({
        queryKey: ['crm-deals'],
        exact: false
      });

      // Também atualizar cache otimisticamente se possível
      if (user?.id) {
        const queryKey = ['crm-deals', user.id, viewAsUserIds?.join(',')];
        queryClient.setQueryData<CRMDealWithContact[]>(
          queryKey,
          (oldData = []) => oldData.filter(deal => deal.id !== dealId)
        );
      }
    },
    onError: (error: Error) => {
      console.error('Erro na mutation de deletar deal:', error);
    },
  });

  // =====================================================
  // Converter lead do WhatsApp para Deal no Pipeline
  // =====================================================
  const convertWhatsAppToDeal = async ({
    conversationId,
    contactName,
    phoneNumber,
    leadStatus,
    detectedProcedure,
    value,
  }: {
    conversationId: string;
    contactName: string | null;
    phoneNumber: string;
    leadStatus: 'quente' | 'convertido';
    detectedProcedure?: string | null;
    value?: number | null;
  }): Promise<{ contact: CRMContact; deal: CRMDeal }> => {
    if (!user?.id) throw new Error('Usuário não autenticado');

    // 1. Verificar se contato já existe pelo telefone
    const normalizedPhone = phoneNumber.replace(/\D/g, '');
    let contact: CRMContact | null = null;

    const { data: existingContacts } = await supabase
      .from('crm_contacts')
      .select('*')
      .or(`phone.ilike.%${normalizedPhone}%,phone.ilike.%${phoneNumber}%`)
      .eq('user_id', user.id)
      .limit(1);

    if (existingContacts && existingContacts.length > 0) {
      contact = existingContacts[0] as CRMContact;
    } else {
      // 2. Criar novo contato
      const { data: newContact, error: contactError } = await supabase
        .from('crm_contacts')
        .insert({
          user_id: user.id,
          full_name: contactName || `WhatsApp ${phoneNumber}`,
          phone: phoneNumber,
          custom_fields: {
            whatsapp_conversation_id: conversationId,
            source: 'whatsapp',
          },
        })
        .select()
        .single();

      if (contactError) throw new Error(`Erro ao criar contato: ${contactError.message}`);
      contact = newContact as CRMContact;
    }

    // 3. Verificar se já existe deal ativo para este contato
    const { data: existingDeals } = await supabase
      .from('crm_deals')
      .select('id, stage')
      .eq('contact_id', contact.id)
      .not('stage', 'in', '("fechado_ganho","fechado_perdido")')
      .limit(1);

    let deal: CRMDeal;

    if (existingDeals && existingDeals.length > 0) {
      // 4a. Atualizar deal existente
      const targetStage = leadStatus === 'convertido' ? 'agendado' : 'lead_novo';

      const { data: updatedDeal, error: updateError } = await supabase
        .from('crm_deals')
        .update({
          stage: targetStage,
          value: value || undefined,
          description: detectedProcedure
            ? `Procedimento de interesse: ${detectedProcedure}`
            : undefined,
        })
        .eq('id', existingDeals[0].id)
        .select()
        .single();

      if (updateError) throw new Error(`Erro ao atualizar deal: ${updateError.message}`);
      deal = updatedDeal as CRMDeal;
    } else {
      // 4b. Criar novo deal
      const targetStage = leadStatus === 'convertido' ? 'agendado' : 'lead_novo';

      const { data: newDeal, error: dealError } = await supabase
        .from('crm_deals')
        .insert({
          user_id: user.id,
          contact_id: contact.id,
          title: contactName || `Lead WhatsApp ${phoneNumber}`,
          stage: targetStage,
          value: value || null,
          description: detectedProcedure
            ? `Procedimento de interesse: ${detectedProcedure}`
            : 'Lead capturado via WhatsApp',
        })
        .select()
        .single();

      if (dealError) throw new Error(`Erro ao criar deal: ${dealError.message}`);
      deal = newDeal as CRMDeal;
    }

    // 5. Atualizar análise do WhatsApp com referência ao deal/contato
    await supabase
      .from('whatsapp_conversation_analysis')
      .update({
        deal_created: true,
        deal_id: deal.id,
        contact_created: true,
        contact_id: contact.id,
      })
      .eq('conversation_id', conversationId);

    // 6. Invalidar queries
    queryClient.invalidateQueries({ queryKey: ['crm-deals'] });
    queryClient.invalidateQueries({ queryKey: ['crm-contacts'] });
    queryClient.invalidateQueries({ queryKey: ['whatsapp-analysis', conversationId] });

    return { contact, deal };
  };

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
    // WhatsApp integration
    convertWhatsAppToDeal,
  };
}
