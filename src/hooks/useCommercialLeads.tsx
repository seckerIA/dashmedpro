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

      console.log('🔍 useCommercialLeads - Fetching leads for:', {
        isSecretaria,
        targetUserIds,
        userId: user.id
      });

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
        const result = await supabaseQueryWithTimeout(queryPromise as any, 90000, signal);
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

        const result = await supabaseQueryWithTimeout(fallbackQuery as any, 30000, signal);
        data = result.data;
        error = result.error;
      }

      if (error) {
        console.error('❌ useCommercialLeads - Error:', error);
        throw error;
      }

      console.log(`✅ useCommercialLeads - Found ${data?.length || 0} leads para IDs:`, targetUserIds);
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

      const { data, error } = await (supabase
        .from("commercial_leads" as any) as any)
        .insert({ ...lead, user_id: user.id } as any)
        .select()
        .single();

      if (error) throw error;
      return data as CommercialLead;
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
