import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "./useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { supabaseQueryWithTimeout } from "@/utils/supabaseQuery";
import { CommercialLead, CommercialLeadInsert, CommercialLeadUpdate } from "@/types/commercial";

export function useCommercialLeads(filters?: { status?: string; origin?: string }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch leads
  const { data: leads, isLoading, error, status, fetchStatus } = useQuery({
    queryKey: ["commercial-leads", user?.id, filters],
    queryFn: async () => {
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/2b337c82-09e3-44a8-815b-68d986435be3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useCommercialLeads.tsx:15',message:'queryFn iniciado',data:{userId:user?.id,hasUser:!!user,filters},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'C'})}).catch(()=>{});
      // #endregion
      
      if (!user) throw new Error("User not authenticated");

      // Verificar sessão antes da query
      let session, sessionError;
      try {
        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/2b337c82-09e3-44a8-815b-68d986435be3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useCommercialLeads.tsx:23',message:'verificando sessão',data:{timestamp:Date.now()},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'A'})}).catch(()=>{});
        // #endregion
        
        const sessionResult = await supabase.auth.getSession();
        session = sessionResult.data?.session;
        sessionError = sessionResult.error;
        
        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/2b337c82-09e3-44a8-815b-68d986435be3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useCommercialLeads.tsx:29',message:'sessão verificada',data:{hasSession:!!session,hasError:!!sessionError,errorMessage:sessionError?.message,userId:session?.user?.id},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'A'})}).catch(()=>{});
        // #endregion
      } catch (err: any) {
        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/2b337c82-09e3-44a8-815b-68d986435be3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useCommercialLeads.tsx:34',message:'erro verificação sessão',data:{errorMessage:err?.message},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'A'})}).catch(()=>{});
        // #endregion
        throw err;
      }

      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/2b337c82-09e3-44a8-815b-68d986435be3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useCommercialLeads.tsx:40',message:'antes query',data:{timestamp:Date.now()},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'C'})}).catch(()=>{});
      // #endregion

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

      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/2b337c82-09e3-44a8-815b-68d986435be3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useCommercialLeads.tsx:60',message:'antes executar query',data:{userId:user.id,hasQuery:!!query},timestamp:Date.now(),sessionId:'debug-session',runId:'run3',hypothesisId:'D'})}).catch(()=>{});
      // #endregion

      // Usar wrapper com timeout de 30 segundos
      // IMPORTANTE: Executar a query ANTES de passar para o wrapper
      const queryStartTime = Date.now();
      let data, error;
      try {
        // Executar a query imediatamente para garantir que a Promise seja iniciada
        const queryPromise = query;
        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/2b337c82-09e3-44a8-815b-68d986435be3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useCommercialLeads.tsx:70',message:'queryPromise criada, passando para wrapper',data:{queryPromiseType:typeof queryPromise,isPromise:queryPromise instanceof Promise},timestamp:Date.now(),sessionId:'debug-session',runId:'run3',hypothesisId:'D'})}).catch(()=>{});
        // #endregion
        const result = await supabaseQueryWithTimeout(queryPromise, 30000);
        
        data = result.data;
        error = result.error;
        
        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/2b337c82-09e3-44a8-815b-68d986435be3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useCommercialLeads.tsx:75',message:'query resultado',data:{hasData:!!data,dataLength:data?.length,hasError:!!error,errorCode:error?.code,errorMessage:error?.message,elapsed:Date.now()-queryStartTime},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'C'})}).catch(()=>{});
        // #endregion
      } catch (err: any) {
        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/2b337c82-09e3-44a8-815b-68d986435be3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useCommercialLeads.tsx:85',message:'erro query',data:{errorMessage:err?.message,isTimeout:err?.message?.includes('timeout'),elapsed:Date.now()-queryStartTime},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'C'})}).catch(()=>{});
        // #endregion
        throw err;
      }

      if (error) throw error;
      
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/2b337c82-09e3-44a8-815b-68d986435be3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useCommercialLeads.tsx:93',message:'queryFn concluído',data:{dataLength:data?.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'C'})}).catch(()=>{});
      // #endregion
      
      return data as CommercialLead[];
    },
    enabled: !!user,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
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
    if (status === 'error' || fetchStatus === 'paused' || (fetchStatus === 'fetching' && isLoading)) {
      fetch('http://127.0.0.1:7243/ingest/2b337c82-09e3-44a8-815b-68d986435be3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useCommercialLeads.tsx:108',message:'query estado mudou',data:{status,fetchStatus,isLoading,hasError:!!error,errorMessage:error?.message,leadsLength:leads?.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'C'})}).catch(()=>{});
    }
  }, [status, fetchStatus, isLoading, error]);
  // #endregion

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













