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
import { getSupabaseErrorMessage } from '@/lib/supabaseErrors';
import { excludePlaceholderContactsQuery, isPlaceholderCrmContact } from '@/lib/crm-placeholder-contact';

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

  queryPromise = excludePlaceholderContactsQuery(queryPromise as any) as typeof queryPromise;

  // Agendamento e CRM: sem limite baixo para não “perder” pacientes reais atrás de lixo
  // ordenado por nome (placeholders já excluídos na query).
  const limit = fetchAll ? 8000 : 3000;

  const { data, error } = await supabaseQueryWithTimeout(
    (queryPromise as any).order('full_name', { ascending: true, nullsFirst: false }).limit(limit),
    30000,
    signal
  );
  if (error) throw new Error(`Erro ao buscar contatos: ${error.message}`);
  return (data as CRMContact[]) || [];
};

/**
 * Deals visíveis conforme RLS. `fetchAll` (ex.: admin/dono/secretária em useCRM) não aplica filtro OR por utilizador;
 * o limite alta evita cortar o quadro em clínicas com muitos cards (ordenado por `position`).
 */
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
    (queryPromise as any).order('position', { ascending: true }).limit(2000),
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

    const fallback = await supabaseQueryWithTimeout(fallbackQuery.limit(2000) as any, 30000, signal);
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

  // Sem .single(): após INSERT o PostgREST pode devolver 0 linhas no SELECT (RLS) e .single() falha com 406/PGRST116
  const insertPromise = (supabase.from(table as any).insert(payload) as any).select();

  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error(`Timeout ao inserir em ${table} (60s) - Fila do navegador possivelmente cheia`)), 60000)
  );

  let result: any;
  try {
    result = await Promise.race([insertPromise, timeoutPromise]);
  } catch (err) {
    console.error(`❌ [createRecord] Exceção fatal no Promise.race para ${table}:`, err);
    throw err instanceof Error ? err : new Error(getSupabaseErrorMessage(err, 'Erro ao inserir'));
  }

  const { data, error } = result as any;

  if (error) {
    console.error(`❌ [createRecord] Erro retornado pelo Supabase em ${table}:`, error);
    throw new Error(getSupabaseErrorMessage(error, `Erro ao inserir em ${table}`));
  }

  const rows = (data || []) as any[];
  if (rows.length === 0) {
    throw new Error(
      'Cadastro não foi confirmado pelo servidor (sem linha retornada). Verifique se sua conta está vinculada a uma organização/clínica ou contate o suporte.'
    );
  }

  console.log(`✅ [createRecord] Inserido com sucesso em ${table}:`, rows[0]);
  return rows[0];
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

import { useEffect } from 'react';

export function useCRM(viewAsUserIds?: string[], fetchAllContacts: boolean = false) {
  const { user, loading } = useAuth();
  const { profile, isSecretaria, isLoading: isLoadingProfile } = useUserProfile();
  const { doctorIds, isLoading: isLoadingDoctors } = useSecretaryDoctors();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!user?.id || !profile?.organization_id || loading || isLoadingProfile || isLoadingDoctors) return;

    let cancelled = false;

    const normalizePhone = (phone?: string | null) => (phone || '').replace(/\D/g, '');
    const phoneKeyLast10 = (phone?: string | null) => {
      const digits = normalizePhone(phone);
      return digits.length >= 10 ? digits.slice(-10) : '';
    };

    const syncInboundLeadsToPipeline = async () => {
      // Leads de formulário do Meta (novos)
      const { data: formRows, error: formErr } = await ((supabase
        .from('lead_form_submissions' as any) as any)
        .select('id, user_id, crm_contact_id, full_name, email, phone_number, created_at')
        .order('created_at', { ascending: false })
        .limit(300));
      if (formErr) {
        console.warn('[useCRM] lead_form_submissions sync skipped:', formErr.message);
      }

      // Leads vindos do WhatsApp
      const { data: waRows, error: waErr } = await ((supabase
        .from('whatsapp_conversations' as any) as any)
        .select('id, user_id, contact_name, phone_number, created_at')
        .order('created_at', { ascending: false })
        .limit(300));
      if (waErr) {
        console.warn('[useCRM] whatsapp_conversations sync skipped:', waErr.message);
      }

      const inboundRows = [
        ...((formRows || []).map((r: any) => ({
          source: 'form',
          sourceId: r.id,
          user_id: r.user_id || user.id,
          crm_contact_id: r.crm_contact_id || null,
          full_name: r.full_name || null,
          email: r.email || null,
          phone: r.phone_number || null,
          created_at: r.created_at,
        })) as any[]),
        ...((waRows || []).map((r: any) => ({
          source: 'whatsapp',
          sourceId: r.id,
          user_id: r.user_id || user.id,
          crm_contact_id: null,
          full_name: r.contact_name || null,
          email: null,
          phone: r.phone_number || null,
          created_at: r.created_at,
        })) as any[]),
      ];

      if (inboundRows.length === 0 || cancelled) return;

      const { data: contactsData } = await (supabase
        .from('crm_contacts')
        .select('id, user_id, full_name, email, phone')
        .eq('organization_id', profile.organization_id)
        .limit(5000) as any);

      const contacts = (contactsData || []) as any[];
      const contactById = new Map<string, any>(contacts.map(c => [c.id, c]));
      const contactByEmail = new Map<string, any>();
      const contactByPhoneLast10 = new Map<string, any>();

      contacts.forEach((c) => {
        const email = (c.email || '').trim().toLowerCase();
        const phoneKey = phoneKeyLast10(c.phone);
        if (email) contactByEmail.set(email, c);
        if (phoneKey) contactByPhoneLast10.set(phoneKey, c);
      });

      const { data: openDealsData } = await ((supabase
        .from('crm_deals' as any) as any)
        .select('id, contact_id')
        .not('stage', 'in', '("fechado_ganho","fechado_perdido")')
        .limit(5000));
      const openDealContactIds = new Set((openDealsData || []).map((d: any) => d.contact_id).filter(Boolean));

      for (const row of inboundRows) {
        if (cancelled) break;

        if (
          isPlaceholderCrmContact({
            full_name: row.full_name,
            phone: row.phone,
            email: row.email,
          })
        ) {
          continue;
        }

        const rowEmail = (row.email || '').trim().toLowerCase();
        const rowPhoneKey = phoneKeyLast10(row.phone);

        let contact = row.crm_contact_id ? contactById.get(row.crm_contact_id) : null;
        if (!contact && rowEmail) contact = contactByEmail.get(rowEmail) || null;
        if (!contact && rowPhoneKey) contact = contactByPhoneLast10.get(rowPhoneKey) || null;

        if (!contact) {
          const { data: createdContact, error: createContactError } = await ((supabase
            .from('crm_contacts' as any) as any)
            .insert({
              user_id: row.user_id || user.id,
              organization_id: profile.organization_id,
              full_name: row.full_name || (row.phone ? `Lead ${row.phone}` : 'Lead'),
              email: row.email || null,
              phone: row.phone || null,
              custom_fields: {
                first_touch_source: row.source === 'whatsapp' ? 'whatsapp_meta' : 'formulario_meta',
                first_touch_at: row.created_at || new Date().toISOString(),
              },
            })
            .select('id, user_id, full_name, email, phone')
            .single());

          if (createContactError || !createdContact) continue;
          contact = createdContact;

          contactById.set(contact.id, contact);
          const cEmail = (contact.email || '').trim().toLowerCase();
          const cPhoneKey = phoneKeyLast10(contact.phone);
          if (cEmail) contactByEmail.set(cEmail, contact);
          if (cPhoneKey) contactByPhoneLast10.set(cPhoneKey, contact);
        }

        if (openDealContactIds.has(contact.id)) {
          continue;
        }

        const { data: createdDeal, error: createDealError } = await ((supabase
          .from('crm_deals' as any) as any)
          .insert({
            user_id: contact.user_id || row.user_id || user.id,
            organization_id: profile.organization_id,
            contact_id: contact.id,
            title: contact.full_name || row.full_name || 'Lead Novo',
            stage: 'lead_novo',
            value: null,
            description: row.source === 'whatsapp' ? 'Lead automático via WhatsApp' : 'Lead automático via formulário',
          })
          .select('id, contact_id')
          .single());

        if (!createDealError && createdDeal?.contact_id) {
          openDealContactIds.add(createdDeal.contact_id);
        }
      }

      queryClient.invalidateQueries({ queryKey: ['crm-deals'] });
      queryClient.invalidateQueries({ queryKey: ['crm-contacts'] });
    };

    syncInboundLeadsToPipeline();

    return () => {
      cancelled = true;
    };
  }, [
    user?.id,
    profile?.organization_id,
    loading,
    isLoadingProfile,
    isLoadingDoctors,
    queryClient,
  ]);

  useEffect(() => {
    if (!user?.id) return;

    // Usando nome único para evitar colisões entre instâncias ou re-renderizações rápidas
    const channelName = `crm-realtime-${user.id}-${Math.random().toString(36).substring(7)}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'crm_deals' },
        () => {
          console.log('🔄 [useCRM] Realtime update: crm_deals changed');
          queryClient.invalidateQueries({ queryKey: ['crm-deals'] });
          queryClient.invalidateQueries({ queryKey: ['team-metrics'] });
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'crm_contacts' },
        () => {
          console.log('🔄 [useCRM] Realtime update: crm_contacts changed');
          queryClient.invalidateQueries({ queryKey: ['crm-contacts'] });
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log(`📡 [useCRM] Realtime subscribed: ${channelName}`);
        }
      });

    return () => {
      console.log(`🔌 [useCRM] Cleaning up realtime: ${channelName}`);
      supabase.removeChannel(channel);
    };
  }, [user?.id, queryClient]);

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
    mutationFn: async (data: any) => {
      const payload = {
        ...data,
        user_id: user?.id,
        organization_id: profile?.organization_id
      };

      if (!payload.organization_id) {
        throw new Error(
          'Sua conta precisa estar vinculada a uma organização (clínica) para cadastrar pacientes. Peça ao administrador para concluir o vínculo ou atualize o cadastro da equipe.'
        );
      }

      // Dedup: procurar contato existente por telefone (ignorando formatação) ou email
      const digitsOnly = (s?: string) => (s || '').replace(/\D/g, '');
      const normalizedPhone = digitsOnly(payload.phone);
      const normalizedEmail = (payload.email || '').trim().toLowerCase();

      if (normalizedPhone || normalizedEmail) {
        // Buscar dentro da mesma organização quando possível (evita duplicatas entre médico e secretária)
        let query = supabase
          .from('crm_contacts')
          .select('id, full_name, phone, email')
          .limit(500);
        if (profile?.organization_id) {
          query = query.eq('organization_id', profile.organization_id);
        } else {
          query = query.eq('user_id', user?.id || '');
        }
        const { data: candidates } = await query;

        const match = (candidates || []).find((c: any) => {
          const phoneMatch = normalizedPhone && digitsOnly(c.phone).endsWith(normalizedPhone.slice(-10));
          const emailMatch = normalizedEmail && (c.email || '').trim().toLowerCase() === normalizedEmail;
          return phoneMatch || emailMatch;
        });

        if (match) {
          console.log(`[createContact] Dedup: contact already exists (${match.id}), skipping insert`);
          // Atualizar campos ausentes no contato existente
          const patch: any = {};
          if (!match.email && payload.email) patch.email = payload.email;
          if (!match.phone && payload.phone) patch.phone = payload.phone;
          if (Object.keys(patch).length > 0) {
            await supabase.from('crm_contacts').update(patch).eq('id', match.id);
          }
          return { ...match, ...patch };
        }
      }

      console.log('🚀 useCRM - Executando createContactMutation com payload:', payload);
      // first_touch_* não são colunas em crm_contacts (schema real); persistir em custom_fields (Json)
      const incomingCf = payload.custom_fields;
      const baseCf: Record<string, unknown> =
        incomingCf && typeof incomingCf === 'object' && !Array.isArray(incomingCf)
          ? { ...(incomingCf as Record<string, unknown>) }
          : {};
      baseCf.first_touch_source =
        (payload as any).first_touch_source ?? baseCf.first_touch_source ?? 'cadastro_manual';
      baseCf.first_touch_at =
        (payload as any).first_touch_at ?? baseCf.first_touch_at ?? new Date().toISOString();

      const { first_touch_source: _fts, first_touch_at: _fta, ...payloadWithoutTouchCols } = payload as any;

      return createRecord('crm_contacts', {
        ...payloadWithoutTouchCols,
        custom_fields: baseCf,
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['crm-contacts'], exact: false });
      await queryClient.refetchQueries({ queryKey: ['crm-contacts'], exact: false, type: 'active' });
    },
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crm-deals'] });
      queryClient.invalidateQueries({ queryKey: ['team-metrics'] });
    },
    onError: (error) => console.error('❌ createDealMutation error:', error),
  });

  const updateDealMutation = useMutation({
    mutationFn: ({ dealId, data }: { dealId: string; data: any }) => updateRecord('crm_deals', dealId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crm-deals'] });
      queryClient.invalidateQueries({ queryKey: ['team-metrics'] });
      queryClient.invalidateQueries({ queryKey: ['marketing-leads'] });
      queryClient.invalidateQueries({ queryKey: ['marketing-dashboard'] });
    },
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crm-deals'] });
      queryClient.invalidateQueries({ queryKey: ['team-metrics'] });
    },
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
    queryClient.invalidateQueries({ queryKey: ['team-metrics'] });
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
