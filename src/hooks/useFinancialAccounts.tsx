import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useToast } from "./use-toast";
import { useUserProfile } from "./useUserProfile";
import { supabaseQueryWithTimeout } from "@/utils/supabaseQuery";
import type {
  FinancialAccount,
  FinancialAccountInsert,
  FinancialAccountUpdate,
  AccountSummary
} from "@/types/financial";

export const useFinancialAccounts = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { profile } = useUserProfile();

  // Buscar todas as contas
  const { data: accounts, isLoading, error } = useQuery({
    queryKey: ["financial-accounts", user?.id, profile?.role],
    queryFn: async () => {
      if (!user) throw new Error("Usuário não autenticado");

      // Admin e Dono veem dados de TODOS os usuários
      const isAdminOrDono = profile?.role === 'admin' || profile?.role === 'dono';

      let query = supabase
        .from("financial_accounts")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(100); // Limitar para performance

      // Se não for admin/dono, filtrar apenas pelo user_id
      if (!isAdminOrDono) {
        query = query.eq("user_id", user.id);
      }

      const result = await supabaseQueryWithTimeout(query as any, 15000); // Timeout reduzido
      const { data, error } = result;

      if (error) throw error;
      return data as FinancialAccount[];
    },
    enabled: !!user,
  });

  // Buscar conta específica
  const getAccount = async (id: string) => {
    if (!user) throw new Error("Usuário não autenticado");

    const { data, error } = await supabase
      .from("financial_accounts")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (error) throw error;
    return data as FinancialAccount;
  };

  // Criar conta
  const createAccountMutation = useMutation({
    mutationFn: async (account: FinancialAccountInsert) => {
      if (!user) throw new Error("Usuário não autenticado");

      const { data, error } = await supabase
        .from("financial_accounts")
        .insert({
          ...account,
          user_id: user.id,
          current_balance: account.initial_balance || 0,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["financial-accounts"] });
      toast({
        title: "Conta criada",
        description: "Conta bancária criada com sucesso!",
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Erro ao criar conta",
        description: error.message,
      });
    },
  });

  // Atualizar conta
  const updateAccountMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: FinancialAccountUpdate }) => {
      if (!user) throw new Error("Usuário não autenticado");

      // Admin e Dono podem editar qualquer conta
      const isAdminOrDono = profile?.role === 'admin' || profile?.role === 'dono';

      let query = supabase
        .from("financial_accounts")
        .update(updates as any)
        .eq("id", id);

      // Se não for admin/dono, só pode editar próprias contas
      if (!isAdminOrDono) {
        query = query.eq("user_id", user.id);
      }

      const { data, error } = await query.select().single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["financial-accounts"] });
      toast({
        title: "Conta atualizada",
        description: "Conta bancária atualizada com sucesso!",
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Erro ao atualizar conta",
        description: error.message,
      });
    },
  });

  // Deletar conta (soft delete)
  const deleteAccountMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!user) throw new Error("Usuário não autenticado");

      // Admin e Dono podem deletar qualquer conta
      const isAdminOrDono = profile?.role === 'admin' || profile?.role === 'dono';

      let query = supabase
        .from("financial_accounts")
        .update({ is_active: false } as any)
        .eq("id", id);

      // Se não for admin/dono, só pode deletar próprias contas
      if (!isAdminOrDono) {
        query = query.eq("user_id", user.id);
      }

      const { data, error } = await query.select().single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["financial-accounts"] });
      toast({
        title: "Conta removida",
        description: "Conta bancária removida com sucesso!",
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Erro ao remover conta",
        description: error.message,
      });
    },
  });

  // Definir conta como padrão
  const setAsDefaultMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!user) throw new Error("Usuário não autenticado");

      // 1. Remover padrão das outras contas do usuário
      const { error: resetError } = await supabase
        .from("financial_accounts")
        .update({ is_default: false } as any)
        .eq("user_id", user.id);

      if (resetError) throw resetError;

      // 2. Definir nova conta padrão
      const { data, error } = await supabase
        .from("financial_accounts")
        .update({ is_default: true } as any)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["financial-accounts"] });
      toast({
        title: "Conta padrão atualizada",
        description: "A conta foi definida como padrão para recebimentos.",
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Erro ao definir conta padrão",
        description: error.message,
      });
    },
  });

  // Calcular totais - incluindo cor
  const accountsSummary: (AccountSummary & { color?: string; owner_name?: string })[] = accounts?.map(account => ({
    id: account.id,
    name: account.name,
    type: account.type as any,
    bank_name: account.bank_name,
    balance: account.current_balance || 0,
    color: account.color || '#3b82f6',
    owner_name: undefined, // TODO: implementar busca separada do nome do criador se necessário
  })) || [];

  const totalBalance = accounts?.reduce((sum, account) => sum + (account.current_balance || 0), 0) || 0;

  return {
    accounts,
    accountsSummary,
    totalBalance,
    isLoading,
    error,
    getAccount,
    createAccount: createAccountMutation.mutate,
    updateAccount: updateAccountMutation.mutateAsync,
    deleteAccount: deleteAccountMutation.mutateAsync,
    setAsDefault: setAsDefaultMutation.mutateAsync,
    isCreating: createAccountMutation.isPending,
    isUpdating: updateAccountMutation.isPending,
    isDeleting: deleteAccountMutation.isPending,
  };
};
