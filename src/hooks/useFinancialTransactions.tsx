import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useToast } from "./use-toast";
import { useUserProfile } from "./useUserProfile";
import type {
  FinancialTransaction,
  FinancialTransactionInsert,
  FinancialTransactionUpdate,
  FinancialTransactionWithDetails,
  TransactionFilters
} from "@/types/financial";

export const useFinancialTransactions = (filters?: TransactionFilters) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { profile } = useUserProfile();

  // Buscar transações
  const queryResult = useQuery({
    queryKey: ["financial-transactions", user?.id, profile?.role, filters],
    queryFn: async () => {
      if (!user) throw new Error("Usuário não autenticado");

      // Admin e Dono veem dados de TODOS os usuários
      const isAdminOrDono = profile?.role === 'admin' || profile?.role === 'dono';

      let query = supabase
        .from("financial_transactions")
        .select(`
          *,
          account:financial_accounts(id, name, type, bank_name),
          category:financial_categories(id, name, type, color, icon),
          deal:crm_deals(id, title, value),
          contact:crm_contacts(id, full_name, company)
        `)
        .order("transaction_date", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(500); // Limitar para performance

      // Se não for admin/dono, filtrar apenas pelo user_id
      if (!isAdminOrDono) {
        query = query.eq("user_id", user.id);
      }

      // Aplicar filtros
      if (filters?.startDate) {
        query = query.gte("transaction_date", filters.startDate);
      }
      if (filters?.endDate) {
        query = query.lte("transaction_date", filters.endDate);
      }
      if (filters?.type) {
        query = query.eq("type", filters.type);
      }
      if (filters?.category_id) {
        query = query.eq("category_id", filters.category_id);
      }
      if (filters?.account_id) {
        query = query.eq("account_id", filters.account_id);
      }
      if (filters?.status) {
        query = query.eq("status", filters.status);
      }
      if (filters?.minAmount !== undefined) {
        query = query.gte("amount", filters.minAmount);
      }
      if (filters?.maxAmount !== undefined) {
        query = query.lte("amount", filters.maxAmount);
      }
      if (filters?.search) {
        query = query.ilike("description", `%${filters.search}%`);
      }

      // Query direta sem wrapper complexo
      const { data, error } = await query;

      if (error) {
        console.error('[Financial] Query error:', error);
        throw error;
      }

      return data;
    },
    enabled: !!user && !!profile, // Aguardar profile carregar também
    staleTime: 2 * 60 * 1000, // 2 minutos
    gcTime: 5 * 60 * 1000,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    retry: 2,
    retryDelay: 1000,
    refetchInterval: false,
    select: (data) => {
      // Transformar os dados para o formato esperado
      const transformedData = data?.map(transaction => ({
        ...transaction,
        account_name: transaction.account?.name,
        category_name: transaction.category?.name,
        deal_title: transaction.deal?.title,
        contact_name: transaction.contact?.full_name,
      })) || [];

      return transformedData as unknown as FinancialTransactionWithDetails[];
    }
  });

  const { data: transactions, isLoading, error } = queryResult;

  // Debug removido para reduzir ruído no console

  // Buscar transação específica
  const getTransaction = async (id: string) => {
    if (!user) throw new Error("Usuário não autenticado");

    const { data, error } = await supabase
      .from("financial_transactions")
      .select(`
        *,
        account:financial_accounts(id, name, type, bank_name),
        category:financial_categories(id, name, type, color, icon),
        deal:crm_deals(id, title, value),
        contact:crm_contacts(id, full_name, company),
        attachments:financial_attachments(*)
      `)
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (error) throw error;
    return data as FinancialTransactionWithDetails;
  };

  // Criar transação
  const createTransactionMutation = useMutation({
    mutationFn: async (transaction: FinancialTransactionInsert) => {
      if (!user) throw new Error("Usuário não autenticado");

      const { data, error } = await supabase
        .from("financial_transactions")
        .insert({
          ...transaction,
          user_id: user.id,
          organization_id: profile?.organization_id,
        })
        .select()
        .single();

      if (error) throw error;

      // Atualizar saldo da conta se a transação estiver concluída
      if (data.account_id && data.status === 'concluida') {
        // Buscar saldo atual da conta
        const { data: account } = await supabase
          .from('financial_accounts')
          .select('current_balance')
          .eq('id', data.account_id)
          .single();

        if (account) {
          const currentBalance = account.current_balance || 0;
          const amount = data.amount || 0;
          // Entrada aumenta saldo, saída diminui
          const newBalance = data.type === 'entrada'
            ? currentBalance + amount
            : currentBalance - amount;

          await supabase
            .from('financial_accounts')
            .update({ current_balance: newBalance })
            .eq('id', data.account_id);
        }
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["financial-transactions"] });
      queryClient.invalidateQueries({ queryKey: ["financial-accounts"] });
      queryClient.invalidateQueries({ queryKey: ["financial-metrics"] });
      toast({
        title: "Transação criada",
        description: "Transação criada com sucesso!",
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Erro ao criar transação",
        description: error.message,
      });
    },
  });

  // Atualizar transação
  const updateTransactionMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: FinancialTransactionUpdate }) => {
      if (!user) throw new Error("Usuário não autenticado");

      const { data, error } = await supabase
        .from("financial_transactions")
        .update(updates)
        .eq("id", id)
        .eq("user_id", user.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["financial-transactions"] });
      queryClient.invalidateQueries({ queryKey: ["financial-accounts"] });
      queryClient.invalidateQueries({ queryKey: ["financial-metrics"] });
      queryClient.invalidateQueries({ queryKey: ["financial-monthly-data"] });
      queryClient.invalidateQueries({ queryKey: ["financial-expenses-by-category"] });
      queryClient.invalidateQueries({ queryKey: ["secretary-sinal-metrics"] });
      toast({
        title: "Transação atualizada",
        description: "Transação atualizada com sucesso!",
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Erro ao atualizar transação",
        description: error.message,
      });
    },
  });

  // Deletar transação
  const deleteTransactionMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!user) throw new Error("Usuário não autenticado");

      const { data, error } = await supabase
        .from("financial_transactions")
        .delete()
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["financial-transactions"] });
      queryClient.invalidateQueries({ queryKey: ["financial-accounts"] });
      queryClient.invalidateQueries({ queryKey: ["financial-metrics"] });
      toast({
        title: "Transação removida",
        description: "Transação removida com sucesso!",
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Erro ao remover transação",
        description: error.message,
      });
    },
  });

  return {
    transactions,
    isLoading,
    error,
    getTransaction,
    createTransaction: createTransactionMutation.mutate,
    updateTransaction: updateTransactionMutation.mutate,
    deleteTransaction: deleteTransactionMutation.mutate,
    isCreating: createTransactionMutation.isPending,
    isUpdating: updateTransactionMutation.isPending,
    isDeleting: deleteTransactionMutation.isPending,
  };
};

