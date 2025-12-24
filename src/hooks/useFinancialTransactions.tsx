import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useToast } from "./use-toast";
import { useUserProfile } from "./useUserProfile";
import { supabaseQueryWithTimeout } from "@/utils/supabaseQuery";
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
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/2b337c82-09e3-44a8-815b-68d986435be3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useFinancialTransactions.tsx:24',message:'queryFn iniciado',data:{userId:user?.id,hasUser:!!user,role:profile?.role},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'C'})}).catch(()=>{});
      // #endregion
      
      if (!user) throw new Error("Usuário não autenticado");

      // Verificar sessão antes da query
      let session, sessionError;
      try {
        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/2b337c82-09e3-44a8-815b-68d986435be3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useFinancialTransactions.tsx:32',message:'verificando sessão',data:{timestamp:Date.now()},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'A'})}).catch(()=>{});
        // #endregion
        
        const sessionResult = await supabase.auth.getSession();
        session = sessionResult.data?.session;
        sessionError = sessionResult.error;
        
        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/2b337c82-09e3-44a8-815b-68d986435be3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useFinancialTransactions.tsx:38',message:'sessão verificada',data:{hasSession:!!session,hasError:!!sessionError,errorMessage:sessionError?.message,userId:session?.user?.id,tokenExpiry:session?.expires_at},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'A'})}).catch(()=>{});
        // #endregion
      } catch (err: any) {
        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/2b337c82-09e3-44a8-815b-68d986435be3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useFinancialTransactions.tsx:42',message:'erro verificação sessão',data:{errorMessage:err?.message},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'A'})}).catch(()=>{});
        // #endregion
        throw err;
      }

      // Admin e Dono veem dados de TODOS os usuários
      const isAdminOrDono = profile?.role === 'admin' || profile?.role === 'dono';

      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/2b337c82-09e3-44a8-815b-68d986435be3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useFinancialTransactions.tsx:50',message:'antes query',data:{isAdminOrDono,userId:user.id},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'C'})}).catch(()=>{});
      // #endregion

      let query = supabase
        .from("financial_transactions")
        .select(`
          *,
          account:financial_accounts(id, name, type, bank_name),
          category:financial_categories(id, name, type, color, icon),
          deal:crm_deals(id, title, value),
          contact:crm_contacts(id, full_name, company)
        `)
        .order("transaction_date", { ascending: false });

      // Se não for admin/dono, filtrar apenas pelo user_id
      if (!isAdminOrDono) {
        query = query.eq("user_id", user.id);
      }

      console.log('useFinancialTransactions - Executando query para user:', user.id, '- Role:', profile?.role, '- Admin/Dono:', isAdminOrDono);

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

      // Usar wrapper com timeout de 30 segundos
      const queryStartTime = Date.now();
      const queryPromise = query;
      
      let data, error;
      try {
        const result = await supabaseQueryWithTimeout(queryPromise, 30000);
        data = result.data;
        error = result.error;
        
        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/2b337c82-09e3-44a8-815b-68d986435be3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useFinancialTransactions.tsx:121',message:'query resultado',data:{hasData:!!data,dataLength:data?.length,hasError:!!error,errorCode:error?.code,errorMessage:error?.message,elapsed:Date.now()-queryStartTime},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'C'})}).catch(()=>{});
        // #endregion
      } catch (err: any) {
        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/2b337c82-09e3-44a8-815b-68d986435be3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useFinancialTransactions.tsx:128',message:'erro query',data:{errorMessage:err?.message,isTimeout:err?.message?.includes('timeout'),elapsed:Date.now()-queryStartTime},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'C'})}).catch(()=>{});
        // #endregion
        throw err;
      }

      console.log('useFinancialTransactions - Query result:', { data, error });

      if (error) throw error;
      
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/2b337c82-09e3-44a8-815b-68d986435be3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useFinancialTransactions.tsx:116',message:'queryFn concluído',data:{dataLength:data?.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'C'})}).catch(()=>{});
      // #endregion
      
      return data;
    },
    enabled: !!user && !!profile, // Aguardar profile carregar também
    staleTime: 2 * 60 * 1000, // 2 minutos
    gcTime: 5 * 60 * 1000,
    refetchOnMount: false,
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

      console.log('useFinancialTransactions - Transformed data (via select):', transformedData);
      
      return transformedData as unknown as FinancialTransactionWithDetails[];
    }
  });
  
  // #region agent log
  useEffect(() => {
    // Só logar quando há mudanças significativas para evitar spam
    if (queryResult.status === 'error' || queryResult.fetchStatus === 'paused' || (queryResult.fetchStatus === 'fetching' && queryResult.isLoading)) {
      fetch('http://127.0.0.1:7243/ingest/2b337c82-09e3-44a8-815b-68d986435be3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useFinancialTransactions.tsx:140',message:'query estado mudou',data:{status:queryResult.status,fetchStatus:queryResult.fetchStatus,isLoading:queryResult.isLoading,hasError:!!queryResult.error,errorMessage:queryResult.error?.message,dataLength:queryResult.data?.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'C'})}).catch(()=>{});
    }
  }, [queryResult.status, queryResult.fetchStatus, queryResult.isLoading, queryResult.error]);
  // #endregion

  const { data: transactions, isLoading, error } = queryResult;

  console.log('useFinancialTransactions - Hook return:');
  console.log('  - transactions:', transactions);
  console.log('  - isLoading:', isLoading);
  console.log('  - error:', error);
  console.log('  - queryResult.data:', queryResult.data);

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
        })
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

      const { data, error} = await supabase
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

