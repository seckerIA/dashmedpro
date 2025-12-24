import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "./useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { supabaseQueryWithTimeout } from "@/utils/supabaseQuery";
import { ensureValidSession } from "@/utils/supabaseHelpers";
import { CommercialProcedure, CommercialProcedureInsert, CommercialProcedureUpdate } from "@/types/commercial";

export function useCommercialProcedures() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: procedures, isLoading, error } = useQuery({
    queryKey: ["commercial-procedures", user?.id],
    queryFn: async ({ signal }) => {
      if (!user) throw new Error("User not authenticated");

      // Verificar e garantir sessão válida
      await ensureValidSession();

      // Executar query com timeout
      const queryPromise = supabase
        .from("commercial_procedures")
        .select("*")
        .eq("user_id", user.id)
        .order("name", { ascending: true });

      const { data, error } = await supabaseQueryWithTimeout(queryPromise, 30000, signal);

      if (error) throw error;
      return data as CommercialProcedure[];
    },
    enabled: !!user,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    retry: 2,
    retryDelay: 1000,
  });

  const createProcedure = useMutation({
    mutationFn: async (procedure: CommercialProcedureInsert) => {
      if (!user) throw new Error("User not authenticated");

      const { data, error } = await supabase
        .from("commercial_procedures")
        .insert({ ...procedure, user_id: user.id })
        .select()
        .single();

      if (error) throw error;
      return data as CommercialProcedure;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["commercial-procedures"] });
      toast({
        title: "Procedimento criado",
        description: "O procedimento foi criado com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao criar procedimento",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateProcedure = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: CommercialProcedureUpdate }) => {
      const { data, error } = await supabase
        .from("commercial_procedures")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data as CommercialProcedure;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["commercial-procedures"] });
      toast({
        title: "Procedimento atualizado",
        description: "O procedimento foi atualizado com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao atualizar procedimento",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteProcedure = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("commercial_procedures")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["commercial-procedures"] });
      toast({
        title: "Procedimento excluído",
        description: "O procedimento foi excluído com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao excluir procedimento",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    procedures: procedures || [],
    isLoading,
    error,
    createProcedure,
    updateProcedure,
    deleteProcedure,
  };
}













