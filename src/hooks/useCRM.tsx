import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase, SUPABASE_URL } from '@/integrations/supabase/client';
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
import { supabaseQueryWithTimeout } from '@/utils/supabaseQuery';

// Fetch contacts - OTIMIZADO
const fetchContacts = async (userId: string): Promise<CRMContact[]> => {
  // #region agent log
  fetch('http://127.0.0.1:7243/ingest/2b337c82-09e3-44a8-815b-68d986435be3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useCRM.tsx:17',message:'fetchContacts iniciado',data:{userId,timestamp:Date.now()},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
  // #endregion
  
  console.log('🔍 useCRM.fetchContacts - Iniciando busca de contatos...');
  console.log('   User ID:', userId);
  console.log('   Supabase URL:', SUPABASE_URL);
  
  if (!userId) {
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/2b337c82-09e3-44a8-815b-68d986435be3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useCRM.tsx:25',message:'fetchContacts sem userId',data:{timestamp:Date.now()},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
    // #endregion
    console.warn('⚠️ useCRM.fetchContacts - User ID não fornecido!');
    return [];
  }
  
  // Verificar sessão atual
  let session, sessionError;
  try {
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/2b337c82-09e3-44a8-815b-68d986435be3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useCRM.tsx:29',message:'fetchContacts antes getSession',data:{timestamp:Date.now()},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    
    const sessionResult = await supabase.auth.getSession();
    session = sessionResult.data?.session;
    sessionError = sessionResult.error;
    
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/2b337c82-09e3-44a8-815b-68d986435be3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useCRM.tsx:35',message:'fetchContacts sessão verificada',data:{hasSession:!!session,hasError:!!sessionError,errorMessage:sessionError?.message,userId:session?.user?.id,tokenExpiry:session?.expires_at},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
  } catch (err: any) {
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/2b337c82-09e3-44a8-815b-68d986435be3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useCRM.tsx:40',message:'fetchContacts erro getSession',data:{errorMessage:err?.message,errorStack:err?.stack},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    throw err;
  }
  
  console.log('   Session exists:', !!session);
  console.log('   Session user ID:', session?.user?.id);
  
  // #region agent log
  fetch('http://127.0.0.1:7243/ingest/2b337c82-09e3-44a8-815b-68d986435be3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useCRM.tsx:58',message:'fetchContacts antes query',data:{timestamp:Date.now()},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'C'})}).catch(()=>{});
  // #endregion
  
  const queryStartTime = Date.now();
  let data, error;
  try {
    // Usar wrapper com timeout de 30 segundos para evitar queries travadas
    const queryPromise = supabase
      .from('crm_contacts')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1000); // Limite para evitar queries muito grandes
    
    const result = await supabaseQueryWithTimeout(queryPromise, 30000);
    data = result.data;
    error = result.error;
    
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/2b337c82-09e3-44a8-815b-68d986435be3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useCRM.tsx:85',message:'fetchContacts query resultado',data:{hasData:!!data,dataLength:data?.length,hasError:!!error,errorCode:error?.code,errorMessage:error?.message,elapsed:Date.now()-queryStartTime},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'C'})}).catch(()=>{});
    // #endregion
  } catch (err: any) {
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/2b337c82-09e3-44a8-815b-68d986435be3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useCRM.tsx:95',message:'fetchContacts erro query',data:{errorMessage:err?.message,isTimeout:err?.message?.includes('timeout'),elapsed:Date.now()-queryStartTime},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'C'})}).catch(()=>{});
    // #endregion
    throw err;
  }

  if (error) {
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/2b337c82-09e3-44a8-815b-68d986435be3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useCRM.tsx:42',message:'fetchContacts erro',data:{errorCode:error.code,errorMessage:error.message,errorDetails:error.details,errorHint:error.hint},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
    // #endregion
    console.error('❌ useCRM.fetchContacts - Erro ao buscar contatos:', {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
    });
    throw new Error(`Erro ao buscar contatos: ${error.message}`);
  }
  
  console.log('✅ useCRM.fetchContacts - Contatos encontrados:', data?.length || 0);
  if (data && data.length > 0) {
    console.log('   TODOS os contatos retornados:', data.map(c => ({ 
      id: c.id, 
      name: c.full_name || c.name,
      email: c.email,
      phone: c.phone,
      user_id: c.user_id,
      created_at: c.created_at,
      custom_fields: c.custom_fields,
      custom_fields_type: typeof c.custom_fields,
      custom_fields_keys: c.custom_fields ? Object.keys(c.custom_fields as any) : []
    })));
  } else {
    console.warn('⚠️ useCRM.fetchContacts - Nenhum contato encontrado para user_id:', userId);
  }
  
  // #region agent log
  fetch('http://127.0.0.1:7243/ingest/2b337c82-09e3-44a8-815b-68d986435be3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useCRM.tsx:66',message:'fetchContacts concluído',data:{dataLength:data?.length||0},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
  // #endregion
  
  return data || [];
};

// Fetch deals with contacts - OTIMIZADO
const fetchDeals = async (userId: string, viewAsUserIds?: string[]): Promise<CRMDealWithContact[]> => {
  // #region agent log
  fetch('http://127.0.0.1:7243/ingest/2b337c82-09e3-44a8-815b-68d986435be3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useCRM.tsx:142',message:'fetchDeals iniciado',data:{userId,viewAsUserIds,timestamp:Date.now()},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'C'})}).catch(()=>{});
  // #endregion
  
  // Verificar sessão antes da query
  let session, sessionError;
  try {
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/2b337c82-09e3-44a8-815b-68d986435be3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useCRM.tsx:149',message:'fetchDeals verificando sessão',data:{timestamp:Date.now()},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    
    const sessionResult = await supabase.auth.getSession();
    session = sessionResult.data?.session;
    sessionError = sessionResult.error;
    
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/2b337c82-09e3-44a8-815b-68d986435be3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useCRM.tsx:155',message:'fetchDeals sessão verificada',data:{hasSession:!!session,hasError:!!sessionError,errorMessage:sessionError?.message,userId:session?.user?.id},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
  } catch (err: any) {
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/2b337c82-09e3-44a8-815b-68d986435be3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useCRM.tsx:160',message:'fetchDeals erro getSession',data:{errorMessage:err?.message},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    throw err;
  }
  
  // Se viewAsUserIds é fornecido, buscar deals desses usuários, senão do userId atual
  const targetUserIds = viewAsUserIds && viewAsUserIds.length > 0 ? viewAsUserIds : [userId];
  
  // Criar condições OR para cada usuário (user_id ou assigned_to)
  const orConditions = targetUserIds
    .map(id => `user_id.eq.${id},assigned_to.eq.${id}`)
    .join(',');
  
  // #region agent log
  fetch('http://127.0.0.1:7243/ingest/2b337c82-09e3-44a8-815b-68d986435be3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useCRM.tsx:172',message:'fetchDeals antes query',data:{orConditions,timestamp:Date.now()},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'C'})}).catch(()=>{});
  // #endregion
  
  const queryStartTime = Date.now();
  let data, error;
  try {
    // Usar wrapper com timeout de 30 segundos
    const queryPromise = supabase
      .from('crm_deals')
      .select(`
        *,
        contact:crm_contacts(*)
      `)
      .or(orConditions)
      .order('position', { ascending: true })
      .limit(1000); // Limite para evitar queries muito grandes
    
    const result = await supabaseQueryWithTimeout(queryPromise, 30000);
    data = result.data;
    error = result.error;
    
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/2b337c82-09e3-44a8-815b-68d986435be3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useCRM.tsx:202',message:'fetchDeals query resultado',data:{hasData:!!data,dataLength:data?.length,hasError:!!error,errorCode:error?.code,errorMessage:error?.message,elapsed:Date.now()-queryStartTime},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'C'})}).catch(()=>{});
    // #endregion
  } catch (err: any) {
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/2b337c82-09e3-44a8-815b-68d986435be3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useCRM.tsx:212',message:'fetchDeals erro query',data:{errorMessage:err?.message,isTimeout:err?.message?.includes('timeout'),elapsed:Date.now()-queryStartTime},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'C'})}).catch(()=>{});
    // #endregion
    throw err;
  }

  if (error) throw new Error(`Erro ao buscar deals: ${error.message}`);
  
  // Buscar profiles em batch (mais eficiente que múltiplas queries)
  if (data && data.length > 0) {
    const userIds = [...new Set(data.map(d => d.user_id).filter(Boolean))];
    const assignedToIds = [...new Set(data.map(d => d.assigned_to).filter((id): id is string => id !== null && id !== undefined))];
    const allProfileIds = [...new Set([...userIds, ...assignedToIds])];
    
    if (allProfileIds.length > 0) {
      // Buscar todos os profiles de uma vez com timeout
      const profilesQuery = supabase
        .from('profiles')
        .select('id, full_name, email')
        .in('id', allProfileIds);
      
      const profilesResult = await supabaseQueryWithTimeout(profilesQuery, 30000);
      const profiles = profilesResult.data;
      
      // Criar mapa para lookup rápido
      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
      
      // Merge profiles with deals
      const result = data.map(deal => ({
        ...deal,
        owner_profile: deal.user_id ? (profileMap.get(deal.user_id) || null) : null,
        assigned_to_profile: deal.assigned_to ? (profileMap.get(deal.assigned_to) || null) : null
      }));
      
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/2b337c82-09e3-44a8-815b-68d986435be3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useCRM.tsx:238',message:'fetchDeals concluído',data:{resultLength:result.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'C'})}).catch(()=>{});
      // #endregion
      
      return result;
    }
  }
  
  const result = (data || []).map(deal => ({ 
    ...deal, 
    owner_profile: null,
    assigned_to_profile: null 
  }));
  
  // #region agent log
  fetch('http://127.0.0.1:7243/ingest/2b337c82-09e3-44a8-815b-68d986435be3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useCRM.tsx:250',message:'fetchDeals concluído sem profiles',data:{resultLength:result.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'C'})}).catch(()=>{});
  // #endregion
  
  return result;
};

// Fetch activities - OTIMIZADO (carregado apenas quando necessário)
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
    .limit(500); // Limite para evitar queries muito grandes

  if (error) throw new Error(`Erro ao buscar atividades: ${error.message}`);
  return data || [];
};

// Create contact
const createContact = async (contactData: CRMContactInsert): Promise<CRMContact> => {
  console.log('💾 useCRM.createContact - Criando contato:', {
    contactData,
    custom_fields: contactData.custom_fields,
    custom_fields_type: typeof contactData.custom_fields,
    custom_fields_stringified: JSON.stringify(contactData.custom_fields),
  });
  
  // Garantir que custom_fields seja um objeto válido
  const insertData = { ...contactData };
  if (insertData.custom_fields !== undefined) {
    if (insertData.custom_fields && typeof insertData.custom_fields === 'object') {
      if (Array.isArray(insertData.custom_fields)) {
        console.warn('⚠️ useCRM.createContact - custom_fields é um array, convertendo para objeto');
        insertData.custom_fields = {} as any;
      }
    }
  }
  
  console.log('💾 useCRM.createContact - Dados que serão enviados para Supabase:', {
    ...insertData,
    custom_fields: insertData.custom_fields,
    custom_fields_stringified: JSON.stringify(insertData.custom_fields),
  });
  
  const { data, error } = await supabase
    .from('crm_contacts')
    .insert(insertData)
    .select()
    .single();

  if (error) {
    console.error('❌ useCRM.createContact - Erro ao criar:', error);
    console.error('   Erro completo:', JSON.stringify(error, null, 2));
    throw new Error(`Erro ao criar contato: ${error.message}`);
  }
  
  console.log('✅ useCRM.createContact - Contato criado:', {
    id: data.id,
    custom_fields: data.custom_fields,
    custom_fields_type: typeof data.custom_fields,
    custom_fields_keys: data.custom_fields ? Object.keys(data.custom_fields as any) : [],
  });
  
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

// Update multiple deals positions (for reordering within same stage)
const updateDealsPositions = async (updates: Array<{ id: string; position: number }>): Promise<void> => {
  // Atualizar cada deal individualmente (Supabase não suporta update múltiplo com diferentes valores facilmente)
  const promises = updates.map(({ id, position }) =>
    supabase
      .from('crm_deals')
      .update({ position })
      .eq('id', id)
  );

  const results = await Promise.all(promises);
  
  // Verificar se algum teve erro
  const errors = results.filter(r => r.error);
  if (errors.length > 0) {
    throw new Error(`Erro ao atualizar posições: ${errors[0].error?.message}`);
  }
};

// Update contact
const updateContact = async ({ contactId, data }: { contactId: string; data: Partial<CRMContact> }): Promise<CRMContact> => {
  console.log('💾 useCRM.updateContact - Atualizando contato:', {
    contactId,
    data,
    custom_fields: data.custom_fields,
    custom_fields_type: typeof data.custom_fields,
    custom_fields_is_object: typeof data.custom_fields === 'object',
    custom_fields_is_null: data.custom_fields === null,
    custom_fields_stringified: JSON.stringify(data.custom_fields),
  });
  
  // Garantir que custom_fields seja um objeto válido ou null
  const updateData = { ...data };
  if (updateData.custom_fields !== undefined) {
    // Se custom_fields for um objeto vazio {}, manter como objeto
    // Se for null, manter como null
    // Se for um objeto com propriedades, manter como objeto
    if (updateData.custom_fields && typeof updateData.custom_fields === 'object') {
      // Garantir que é um objeto JavaScript válido (não array, não Date, etc)
      if (Array.isArray(updateData.custom_fields)) {
        console.warn('⚠️ useCRM.updateContact - custom_fields é um array, convertendo para objeto');
        updateData.custom_fields = {} as any;
      } else {
        // É um objeto válido, manter como está
        console.log('✅ useCRM.updateContact - custom_fields é um objeto válido:', updateData.custom_fields);
      }
    }
  }
  
  console.log('💾 useCRM.updateContact - Dados que serão enviados para Supabase:', {
    ...updateData,
    custom_fields: updateData.custom_fields,
    custom_fields_stringified: JSON.stringify(updateData.custom_fields),
  });
  
  const { data: updatedContact, error } = await supabase
    .from('crm_contacts')
    .update(updateData)
    .eq('id', contactId)
    .select()
    .single();

  if (error) {
    console.error('❌ useCRM.updateContact - Erro ao atualizar:', error);
    console.error('   Erro completo:', JSON.stringify(error, null, 2));
    throw new Error(`Erro ao atualizar contato: ${error.message}`);
  }
  
  console.log('✅ useCRM.updateContact - Contato atualizado:', {
    id: updatedContact.id,
    custom_fields: updatedContact.custom_fields,
    custom_fields_type: typeof updatedContact.custom_fields,
    custom_fields_keys: updatedContact.custom_fields ? Object.keys(updatedContact.custom_fields as any) : [],
  });
  
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

  // Queries com cache otimizado
  const {
    data: contacts = [],
    isLoading: isLoadingContacts,
    refetch: refetchContacts,
    error: contactsError,
    status: contactsStatus,
    fetchStatus: contactsFetchStatus,
  } = useQuery({
    queryKey: ['crm-contacts', user?.id],
    queryFn: async () => {
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/2b337c82-09e3-44a8-815b-68d986435be3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useCRM.tsx:339',message:'useQuery queryFn iniciado',data:{userId:user?.id,hasUser:!!user},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
      // #endregion
      
      if (!user?.id) {
        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/2b337c82-09e3-44a8-815b-68d986435be3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useCRM.tsx:342',message:'useQuery sem userId',data:{timestamp:Date.now()},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
        // #endregion
        console.warn('⚠️ useCRM - Tentando buscar contatos sem user.id');
        return [];
      }
      try {
        const result = await fetchContacts(user.id);
        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/2b337c82-09e3-44a8-815b-68d986435be3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useCRM.tsx:346',message:'useQuery queryFn sucesso',data:{resultLength:result.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
        // #endregion
        return result;
      } catch (error: any) {
        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/2b337c82-09e3-44a8-815b-68d986435be3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useCRM.tsx:350',message:'useQuery queryFn erro',data:{errorMessage:error?.message,errorStack:error?.stack},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
        // #endregion
        console.error('❌ useCRM - Erro ao buscar contatos:', error);
        // Retornar array vazio em caso de erro para não travar a UI
        return [];
      }
    },
    enabled: !!user?.id && !loading, // Aguardar auth terminar de carregar
    staleTime: 2 * 60 * 1000, // 2 minutos - aumentar para reduzir refetches
    gcTime: 5 * 60 * 1000,
    refetchOnMount: false, // Desabilitar refetch automático no mount
    refetchOnWindowFocus: false, // Desabilitado para evitar loops
    refetchOnReconnect: true,
    retry: 2,
    retryDelay: 1000,
    refetchInterval: false, // Desabilitar refetch automático por intervalo
  });
  
  // #region agent log
  useEffect(() => {
    // Só logar quando há mudanças significativas para evitar spam
    if (contactsStatus === 'error' || contactsFetchStatus === 'paused' || (contactsFetchStatus === 'fetching' && isLoadingContacts)) {
      fetch('http://127.0.0.1:7243/ingest/2b337c82-09e3-44a8-815b-68d986435be3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useCRM.tsx:405',message:'useQuery estado mudou',data:{status:contactsStatus,fetchStatus:contactsFetchStatus,isLoading:isLoadingContacts,hasError:!!contactsError,errorMessage:contactsError?.message,contactsLength:contacts.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'C'})}).catch(()=>{});
    }
  }, [contactsStatus, contactsFetchStatus, isLoadingContacts, contactsError]);
  // #endregion

  // Log de debug quando os contatos mudarem
  useEffect(() => {
    console.log('📊 useCRM - Estado dos contatos:', {
      contactsLength: contacts.length,
      isLoadingContacts,
      userId: user?.id,
      hasError: !!contactsError,
      error: contactsError,
    });
  }, [contacts, isLoadingContacts, user?.id, contactsError]);

  const {
    data: deals = [],
    isLoading: isLoadingDeals,
    status: dealsStatus,
    fetchStatus: dealsFetchStatus,
    error: dealsError,
  } = useQuery({
    queryKey: ['crm-deals', user?.id, viewAsUserIds?.join(',')],
    queryFn: async () => {
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/2b337c82-09e3-44a8-815b-68d986435be3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useCRM.tsx:430',message:'useQuery deals queryFn iniciado',data:{userId:user?.id,hasUser:!!user,viewAsUserIds},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'C'})}).catch(()=>{});
      // #endregion
      
      if (!user?.id) {
        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/2b337c82-09e3-44a8-815b-68d986435be3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useCRM.tsx:435',message:'useQuery deals sem userId',data:{timestamp:Date.now()},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'C'})}).catch(()=>{});
        // #endregion
        return [];
      }
      try {
        const result = await fetchDeals(user.id, viewAsUserIds);
        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/2b337c82-09e3-44a8-815b-68d986435be3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useCRM.tsx:440',message:'useQuery deals queryFn sucesso',data:{resultLength:result.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'C'})}).catch(()=>{});
        // #endregion
        return result;
      } catch (error: any) {
        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/2b337c82-09e3-44a8-815b-68d986435be3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useCRM.tsx:445',message:'useQuery deals queryFn erro',data:{errorMessage:error?.message,errorStack:error?.stack},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'C'})}).catch(()=>{});
        // #endregion
        console.error('❌ useCRM - Erro ao buscar deals:', error);
        return [];
      }
    },
    enabled: !!user?.id && !loading, // Aguardar auth terminar de carregar
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    retry: 2,
    retryDelay: 1000,
    refetchInterval: false,
  });
  
  // #region agent log
  useEffect(() => {
    // Só logar quando há mudanças significativas
    if (dealsStatus === 'error' || dealsFetchStatus === 'paused' || (dealsFetchStatus === 'fetching' && isLoadingDeals)) {
      fetch('http://127.0.0.1:7243/ingest/2b337c82-09e3-44a8-815b-68d986435be3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useCRM.tsx:460',message:'useQuery deals estado mudou',data:{status:dealsStatus,fetchStatus:dealsFetchStatus,isLoading:isLoadingDeals,hasError:!!dealsError,errorMessage:dealsError?.message,dealsLength:deals.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'C'})}).catch(()=>{});
    }
  }, [dealsStatus, dealsFetchStatus, isLoadingDeals, dealsError]);
  // #endregion

  // Activities são carregadas apenas quando necessário (lazy loading)
  const {
    data: activities = [],
    isLoading: isLoadingActivities,
  } = useQuery({
    queryKey: ['crm-activities', user?.id],
    queryFn: () => fetchActivities(user?.id || ''),
    enabled: false, // Desabilitado por padrão - carregar apenas quando necessário
    staleTime: 5 * 60 * 1000, // Cache por 5 minutos
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
      // Forçar refetch imediato dos deals para atualizar os cards
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
    
    // Refetch functions
    refetchContacts,

    // Mutations
    createContact: createContactMutation.mutateAsync,
    createDeal: createDealMutation.mutateAsync,
    createActivity: createActivityMutation.mutateAsync,
    updateDeal: updateDealMutation.mutateAsync,
    updateDealsPositions: updateDealsPositionsMutation.mutateAsync,
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
