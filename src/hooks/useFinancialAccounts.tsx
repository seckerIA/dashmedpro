import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useToast } from "./use-toast";
import { useUserProfile } from "./useUserProfile";
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
        .order("created_at", { ascending: false });

      // Se não for admin/dono, filtrar apenas pelo user_id
      if (!isAdminOrDono) {
        query = query.eq("user_id", user.id);
      }

      const { data, error } = await query;

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

      const { data, error } = await supabase
        .from("financial_accounts")
        .update(updates)
        .eq("id", id)
        .eq("user_id", user.id)
        .select()
        .single();

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

      const { data, error } = await supabase
        .from("financial_accounts")
        .update({ is_active: false })
        .eq("id", id)
        .eq("user_id", user.id)
        .select()
        .single();

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

  // Calcular totais
  const accountsSummary: AccountSummary[] = accounts?.map(account => ({
    id: account.id,
    name: account.name,
    type: account.type as any,
    bank_name: account.bank_name,
    balance: account.current_balance || 0,
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
    updateAccount: updateAccountMutation.mutate,
    deleteAccount: deleteAccountMutation.mutate,
    isCreating: createAccountMutation.isPending,
    isUpdating: updateAccountMutation.isPending,
    isDeleting: deleteAccountMutation.isPending,
  };
};

