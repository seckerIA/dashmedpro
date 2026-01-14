import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import { useAuth } from "./useAuth";
import { useUserProfile } from "./useUserProfile";
import { useSecretaryDoctors } from "./useSecretaryDoctors";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { supabaseQueryWithTimeout } from "@/utils/supabaseQuery";
import { CommercialLead, CommercialLeadInsert, CommercialLeadUpdate } from "@/types/commercial";

export function useCommercialLeads(filters?: { status?: string; origin?: string }) {
  const { user } = useAuth();
  const { isSecretaria, isLoading: isLoadingProfile } = useUserProfile();
  const { doctorIds, isLoading: isLoadingDoctors } = useSecretaryDoctors();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const targetUserIds = useMemo(() => {
    if (!user?.id) return [];
    return isSecretaria && doctorIds?.length > 0
      ? [user.id, ...doctorIds]
      : [user.id];
  }, [user?.id, isSecretaria, doctorIds]);

  // Fetch leads
  const { data: leads, isLoading, error } = useQuery({
    queryKey: ["commercial-leads", user?.id, filters, targetUserIds],
    queryFn: async ({ signal }) => {
      if (!user) throw new Error("User not authenticated");

      // console.log('🔍 useCommercialLeads - Fetching leads for:', { isSecretaria, targetUserIds, userId: user.id });

      let queryPromise;

      if (isSecretaria && (targetUserIds || []).length > 1) {
        queryPromise = supabase
          .from("commercial_leads" as any)
          .select(`
            *,
            doctor:profiles!commercial_leads_user_id_profiles_fk (full_name, email)
          `)
          .in("user_id", targetUserIds)
          .order("created_at", { ascending: false });
      } else {
        queryPromise = supabase
          .from("commercial_leads" as any)
          .select(`
            *,
            doctor:profiles!commercial_leads_user_id_profiles_fk (full_name, email)
          `)
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });
      }

      if (filters?.status) {
        queryPromise = (queryPromise as any).eq("status", filters.status);
      }

      if (filters?.origin) {
        queryPromise = (queryPromise as any).eq("origin", filters.origin);
      }

      let data, error;

      try {
        const result = await supabaseQueryWithTimeout(queryPromise as any, 120000, signal);
        data = result.data;
        error = result.error;
      } catch (err: any) {
        console.warn('⚠️ useCommercialLeads - Timeout ou erro na query principal, tentando fallback sem join...');

        // Fallback sem o join com profiles para ser mais rápido
        const fallbackQuery = supabase
          .from("commercial_leads" as any)
          .select("*")
          .in("user_id", targetUserIds)
          .order("created_at", { ascending: false });

        const result = await supabaseQueryWithTimeout(fallbackQuery as any, undefined, signal);
        data = result.data;
        error = result.error;
      }

      if (error) {
        console.error('❌ useCommercialLeads - Error:', error);
        throw error;
      }

      // console.log(`✅ useCommercialLeads - Found ${data?.length || 0} leads para IDs:`, targetUserIds);
      return data as CommercialLead[];
    },
    enabled: !!user && (!isSecretaria || !isLoadingDoctors),
    staleTime: 10 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    retry: 2,
    retryDelay: 1000,
  });

  // Create lead
  const createLead = useMutation({
    mutationFn: async (lead: CommercialLeadInsert) => {
      if (!user) throw new Error("User not authenticated");

      // 1. Criar no commercial_leads (tabela original deste hook)
      const { data: createdLead, error } = await (supabase
        .from("commercial_leads" as any) as any)
        .insert({ ...lead, user_id: user.id } as any)
        .select()
        .single();

      if (error) throw error;

      // 2. Integração com CRM Pipeline (crm_contacts e crm_deals)
      try {
        console.log('🔄 Sincronizando novo lead com Pipeline CRM...');
        let contactId: string | null = null;
        const phone = lead.phone?.replace(/\D/g, '') || null;
        const email = lead.email?.trim().toLowerCase() || null;

        // Tentar encontrar contato existente
        if (phone || email) {
          let query = supabase.from('crm_contacts').select('id');
          const conditions = [];
          if (phone) conditions.push(`phone.ilike.%${phone}%`);
          if (email) conditions.push(`email.eq.${email}`);

          if (conditions.length > 0) {
            const { data: existingContacts } = await query.or(conditions.join(',')).limit(1);
            if (existingContacts && existingContacts.length > 0) {
              contactId = existingContacts[0].id;
              console.log('✅ Contato existente encontrado:', contactId);
            }
          }
        }

        // Se não encontrou, criar novo contato
        if (!contactId) {
          const { data: newContact, error: contactError } = await (supabase
            .from('crm_contacts' as any) as any)
            .insert({
              full_name: lead.name,
              email: lead.email || null,
              phone: lead.phone || null,
              user_id: user.id,
              origin: lead.origin // Se houver campo origin no contacts, senão ignora
              // notes: lead.notes // Se quiser levar as notas para o contato
            } as any)
            .select()
            .single();

          if (contactError) {
            console.error('❌ Erro ao criar contato no CRM:', contactError);
          } else if (newContact) {
            contactId = newContact.id;
            console.log('✅ Novo contato criado no CRM:', contactId);
          }
        }

        // Se temos um contato, criar o Deal (Lead Novo)
        if (contactId) {
          const { error: dealError } = await (supabase
            .from('crm_deals' as any) as any)
            .insert({
              title: lead.name, // Nome do deal geralmente é o nome da pessoa ou "Interesse X"
              contact_id: contactId,
              user_id: user.id,
              stage: 'lead_novo', // Forçar entrada no início do pipeline
              value: lead.estimated_value || null,
              description: lead.notes || `Criado via Novo Paciente (Origem: ${lead.origin})`,
              created_at: new Date().toISOString()
            } as any);

          if (dealError) {
            console.error('❌ Erro ao criar deal no CRM:', dealError);
          } else {
            console.log('✅ Deal criado com sucesso no Pipeline (lead_novo)');
            // Invalidar queries do CRM para atualizar a tela se estiver aberta
            queryClient.invalidateQueries({ queryKey: ["crm-deals"] });
            queryClient.invalidateQueries({ queryKey: ["crm-contacts"] });
          }
        }
      } catch (syncError) {
        console.error('⚠️ Falha não-bloqueante na sincronização com CRM:', syncError);
        // Não jogamos o erro para não impedir a criação no commercial_leads, 
        // mas logamos para debug.
      }

      return createdLead as CommercialLead;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["commercial-leads"] });
      queryClient.invalidateQueries({ queryKey: ["commercial-metrics"] });
      toast({
        title: "Lead criado",
        description: "O lead foi criado com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao criar lead",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update lead
  const updateLead = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: CommercialLeadUpdate }) => {
      const { data, error } = await (supabase
        .from("commercial_leads" as any) as any)
        .update(updates as any)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;

      // Sincronizar com crm_contacts se houver um contato vinculado
      try {
        if (data.contact_id && (updates.name || updates.email || updates.phone)) {
          console.log('🔄 Sincronizando edição com CRM Contact:', data.contact_id);
          const contactUpdates: any = {};
          if (updates.name) contactUpdates.full_name = updates.name;
          // Permitir limpar email/phone se vier como string vazia ou null
          if (updates.email !== undefined) contactUpdates.email = updates.email || null;
          if (updates.phone !== undefined) contactUpdates.phone = updates.phone?.replace(/\D/g, '') || null; // Salvar apenas números no CRM

          if (Object.keys(contactUpdates).length > 0) {
            const { error: syncError } = await (supabase
              .from('crm_contacts' as any) as any)
              .update(contactUpdates)
              .eq('id', data.contact_id);

            if (syncError) {
              console.error('❌ Erro ao sincronizar contato no CRM:', syncError);
            } else {
              console.log('✅ Contato CRM sincronizado com sucesso.');
              queryClient.invalidateQueries({ queryKey: ["crm-contacts"] });
              queryClient.invalidateQueries({ queryKey: ["crm-deals"] });
            }
          }
        }
      } catch (syncErr) {
        console.error('⚠️ Erro não bloqueante na sincronização de edição:', syncErr);
      }

      return data as CommercialLead;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["commercial-leads"] });
      queryClient.invalidateQueries({ queryKey: ["commercial-metrics"] });
      toast({
        title: "Lead atualizado",
        description: "O lead foi atualizado com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao atualizar lead",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete lead
  const deleteLead = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("commercial_leads")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["commercial-leads"] });
      queryClient.invalidateQueries({ queryKey: ["commercial-metrics"] });
      toast({
        title: "Lead excluído",
        description: "O lead foi excluído com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao excluir lead",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Convert lead to contact
  const convertLead = useMutation({
    mutationFn: async ({ leadId, contactId }: { leadId: string; contactId: string }) => {
      const { data, error } = await (supabase
        .from("commercial_leads" as any) as any)
        .update({
          status: "converted",
          contact_id: contactId,
          converted_at: new Date().toISOString(),
        } as any)
        .eq("id", leadId)
        .select()
        .single();

      if (error) throw error;
      return data as CommercialLead;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["commercial-leads"] });
      queryClient.invalidateQueries({ queryKey: ["commercial-metrics"] });
      queryClient.invalidateQueries({ queryKey: ["crm-contacts"] });
      toast({
        title: "Lead convertido",
        description: "O lead foi convertido em contato com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao converter lead",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    leads: leads || [],
    isLoading,
    error,
    createLead,
    updateLead,
    deleteLead,
    convertLead,
  };
}
