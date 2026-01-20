import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { useAuth } from "./useAuth";
import { useUserProfile } from "./useUserProfile";
import { useSecretaryDoctors } from "./useSecretaryDoctors";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { supabaseQueryWithTimeout } from "@/utils/supabaseQuery";
import { ensureValidSession } from "@/utils/supabaseHelpers";
import { CommercialProcedure, CommercialProcedureInsert, CommercialProcedureUpdate } from "@/types/commercial";

export function useCommercialProcedures(viewAsUserIds?: string[]) {
  const { user } = useAuth();
  const { profile, isSecretaria, isAdmin } = useUserProfile();
  const { doctorIds, isLoading: isLoadingDoctors } = useSecretaryDoctors();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Estado para todos os user IDs quando admin
  const [allActiveUserIds, setAllActiveUserIds] = useState<string[]>([]);

  // Buscar todos os usuários ativos quando admin
  useEffect(() => {
    if (!isAdmin || !user?.id) {
      setAllActiveUserIds([]);
      return;
    }

    const fetchAllUsers = async () => {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id')
        .eq('is_active', true)
        .limit(100);

      if (profiles && profiles.length > 0) {
        setAllActiveUserIds((profiles as { id: string }[]).map(p => p.id));
      }
    };

    fetchAllUsers();
  }, [isAdmin, user?.id]);

  const { data: procedures, isLoading, error } = useQuery({
    queryKey: ["commercial-procedures", user?.id, isAdmin, isSecretaria, doctorIds, allActiveUserIds, viewAsUserIds],
    queryFn: async ({ signal }) => {
      if (!user) throw new Error("User not authenticated");

      // Verificar e garantir sessão válida
      await ensureValidSession();

      // Query com join para pegar dados do médico
      let queryPromise = supabase
        .from("commercial_procedures")
        .select(`
          *,
          doctor:profiles!commercial_procedures_user_id_profiles_fk (full_name, email)
        `);

      if (viewAsUserIds && viewAsUserIds.length > 0) {
        // Filtro manual selecionado
        (queryPromise as any).in("user_id", viewAsUserIds);
      } else if (isAdmin || isSecretaria) {
        // Admin e Secretária veem TUDO da organização (RLS cuida do resto)
        // Não filtramos por ID, deixamos o banco retornar tudo que o usuário pode ver
      } else {
        // Médicos e outros usuários veem apenas seus próprios procedimentos
        (queryPromise as any).eq("user_id", user.id);
      }

      (queryPromise as any).order("name", { ascending: true });

      const { data, error } = await supabaseQueryWithTimeout(queryPromise as any, 30000, signal);

      if (error) throw error;

      // Ordenar para que CONSULTA apareça primeiro
      const sortedProcedures = (data as CommercialProcedure[] || []).sort((a, b) => {
        if (a.name === 'CONSULTA') return -1;
        if (b.name === 'CONSULTA') return 1;
        return a.name.localeCompare(b.name);
      });

      return sortedProcedures;
    },
    // Para admin, aguardar carregar a lista de usuários
    // Para secretária, aguardar carregar doctorIds
    enabled: !!user && !!profile && (!isSecretaria || !isLoadingDoctors) && (!isAdmin || allActiveUserIds.length > 0),
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
        .insert({ ...procedure, user_id: procedure.user_id || user.id })
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













