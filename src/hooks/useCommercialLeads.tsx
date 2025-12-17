import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "./useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { CommercialLead, CommercialLeadInsert, CommercialLeadUpdate } from "@/types/commercial";

export function useCommercialLeads(filters?: { status?: string; origin?: string }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch leads
  const { data: leads, isLoading, error } = useQuery({
    queryKey: ["commercial-leads", user?.id, filters],
    queryFn: async () => {
      if (!user) throw new Error("User not authenticated");

      let query = supabase
        .from("commercial_leads")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (filters?.status) {
        query = query.eq("status", filters.status);
      }

      if (filters?.origin) {
        query = query.eq("origin", filters.origin);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as CommercialLead[];
    },
    enabled: !!user,
  });

  // Create lead
  const createLead = useMutation({
    mutationFn: async (lead: CommercialLeadInsert) => {
      if (!user) throw new Error("User not authenticated");

      const { data, error } = await supabase
        .from("commercial_leads")
        .insert({ ...lead, user_id: user.id })
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
      const { data, error } = await supabase
        .from("commercial_leads")
        .update(updates)
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
      const { data, error } = await supabase
        .from("commercial_leads")
        .update({
          status: "converted",
          contact_id: contactId,
          converted_at: new Date().toISOString(),
        })
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







