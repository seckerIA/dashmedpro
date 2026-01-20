import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useUserProfile } from "./useUserProfile";
import { supabaseQueryWithTimeout } from "@/utils/supabaseQuery";
import type {
  FinancialMetrics,
  MonthlyData,
  CategoryExpense,
  CashFlowProjection,
  CostBreakdown
} from "@/types/financial";
import { useCostsBreakdown } from "./useTransactionCosts";
import { startOfMonth, endOfMonth, subMonths, format, addMonths } from "date-fns";

export const useFinancialMetrics = (filters?: { startDate?: Date; endDate?: Date }) => {
  const { user } = useAuth();
  const { profile } = useUserProfile();

  const now = new Date();
  const currentMonthStart = filters?.startDate || startOfMonth(now);
  const currentMonthEnd = filters?.endDate || endOfMonth(now);

  // Buscar breakdown de custos do período selecionado
  const { data: costsBreakdown } = useCostsBreakdown(
    format(currentMonthStart, "yyyy-MM-dd"),
    format(currentMonthEnd, "yyyy-MM-dd")
  );

  const { data: metrics, isLoading, error } = useQuery({
    queryKey: ["financial-metrics", user?.id, profile?.role, filters?.startDate, filters?.endDate],
    queryFn: async ({ signal }) => {
      if (!user) throw new Error("Usuário não autenticado");

      // RLS will automatically filter by organization_id based on user's membership
      // No need for manual user_id filtering - this was causing cross-org data leaks

      // 1. Buscar todas as contas ativas (RLS will filter by organization)
      const accountsQuery = supabase
        .from("financial_accounts")
        .select("current_balance")
        .eq("is_active", true);

      const accountsResult = await supabaseQueryWithTimeout(accountsQuery as any, undefined, signal);
      const { data: accounts } = accountsResult;
      const accountsData = (accounts || []) as Array<{ current_balance: number }>;
      const totalBalance = accountsData.reduce((sum, acc) => sum + (acc.current_balance || 0), 0);

      // 2. Buscar transações do mês atual (com custos) - RLS handles organization filtering
      const transactionsQuery = supabase
        .from("financial_transactions")
        .select("type, amount, status, total_costs, has_costs")
        .eq("status", "concluida")
        .gte("transaction_date", format(currentMonthStart, "yyyy-MM-dd"))
        .lte("transaction_date", format(currentMonthEnd, "yyyy-MM-dd"));

      const transactionsResult = await supabaseQueryWithTimeout(transactionsQuery as any, undefined, signal);
      const { data: currentMonthTransactions } = transactionsResult;
      const transactionsData = (currentMonthTransactions || []) as Array<{
        type: string;
        amount: number;
        has_costs?: boolean;
        total_costs?: number;
      }>;

      const monthRevenue = transactionsData
        .filter(t => t.type === "entrada")
        .reduce((sum, t) => sum + t.amount, 0);

      const monthExpenses = transactionsData
        .filter(t => t.type === "saida")
        .reduce((sum, t) => sum + t.amount, 0);

      // Calcular custos totais (apenas de entradas)
      const monthTotalCosts = transactionsData
        .filter(t => t.type === "entrada" && t.has_costs)
        .reduce((sum, t) => sum + (t.total_costs || 0), 0);

      // Lucro bruto (receitas - despesas)
      const monthProfit = monthRevenue - monthExpenses;

      // Lucro líquido (receitas - despesas - custos)
      const monthNetProfit = monthRevenue - monthExpenses - monthTotalCosts;

      const profitMargin = monthRevenue > 0 ? (monthProfit / monthRevenue) * 100 : 0;
      const netProfitMargin = monthRevenue > 0 ? (monthNetProfit / monthRevenue) * 100 : 0;

      // 3. Contar transações ativas - RLS handles organization filtering
      const countQuery = supabase
        .from("financial_transactions")
        .select("*", { count: "exact", head: true })
        .eq("status", "concluida");

      const countResult = await supabaseQueryWithTimeout(countQuery as any, undefined, signal);
      const activeTransactions = (countResult as any).count || 0;

      const metricsData: FinancialMetrics = {
        totalBalance,
        monthRevenue,
        monthExpenses,
        monthProfit,
        profitMargin,
        totalAccounts: accountsData?.length || 0,
        activeTransactions: activeTransactions || 0,
        monthTotalCosts,
        monthNetProfit,
        netProfitMargin,
      };

      return metricsData;
    },
    enabled: !!user && !!profile,
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: 1,
    retryDelay: 2000,
  });

  // Dados mensais dos últimos 5 meses
  const { data: monthlyData } = useQuery({
    queryKey: ["financial-monthly-data", user?.id, profile?.role],
    queryFn: async ({ signal }) => {
      if (!user) throw new Error("Usuário não autenticado");

      const now = new Date();
      const monthlyResults: MonthlyData[] = [];

      for (let i = 4; i >= 0; i--) {
        const monthDate = subMonths(now, i);
        const monthStart = startOfMonth(monthDate);
        const monthEnd = endOfMonth(monthDate);

        const query = supabase
          .from("financial_transactions")
          .select("type, amount")
          .eq("status", "concluida")
          .gte("transaction_date", format(monthStart, "yyyy-MM-dd"))
          .lte("transaction_date", format(monthEnd, "yyyy-MM-dd"));

        const queryResult = await supabaseQueryWithTimeout(query as any, undefined, signal);
        const { data } = queryResult;
        const transactionsData = (data || []) as Array<{ type: string; amount: number }>;

        const receitas = transactionsData.filter(t => t.type === "entrada").reduce((sum, t) => sum + t.amount, 0);
        const despesas = transactionsData.filter(t => t.type === "saida").reduce((sum, t) => sum + t.amount, 0);

        monthlyResults.push({
          month: format(monthDate, "MMM"),
          receitas,
          despesas,
          lucro: receitas - despesas,
        });
      }

      return monthlyResults;
    },
    enabled: !!user && !!profile,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: 1,
    retryDelay: 2000,
  });

  // Despesas por categoria (período selecionado)
  const { data: expensesByCategory } = useQuery({
    queryKey: ["financial-expenses-by-category", user?.id, profile?.role, filters?.startDate, filters?.endDate],
    queryFn: async ({ signal }) => {
      if (!user) throw new Error("Usuário não autenticado");

      const monthStart = currentMonthStart;
      const monthEnd = currentMonthEnd;

      const query = supabase
        .from("financial_transactions")
        .select(`
          amount,
          category:financial_categories(name, color)
        `)
        .eq("type", "saida")
        .eq("status", "concluida")
        .gte("transaction_date", format(monthStart, "yyyy-MM-dd"))
        .lte("transaction_date", format(monthEnd, "yyyy-MM-dd"));

      const queryResult = await supabaseQueryWithTimeout(query as any, undefined, signal);
      const { data } = queryResult;
      const transactionsData = (data || []) as Array<{
        amount: number;
        category?: { name: string; color: string } | null;
      }>;

      // Agrupar por categoria
      const grouped = transactionsData.reduce((acc, transaction) => {
        const categoryName = transaction.category?.name || "Outros";
        const categoryColor = transaction.category?.color || "#6b7280";

        if (!acc[categoryName]) {
          acc[categoryName] = {
            name: categoryName,
            value: 0,
            color: categoryColor,
            percentage: 0,
          };
        }

        acc[categoryName].value += transaction.amount;
        return acc;
      }, {} as Record<string, CategoryExpense>);

      const categoryResults = Object.values(grouped || {}) as CategoryExpense[];
      const total = categoryResults.reduce((sum, cat) => sum + cat.value, 0);

      // Calcular porcentagens
      categoryResults.forEach(cat => {
        cat.percentage = total > 0 ? (cat.value / total) * 100 : 0;
      });

      return categoryResults.sort((a, b) => b.value - a.value);
    },
    enabled: !!user && !!profile,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: 1,
    retryDelay: 2000,
  });

  // Projeção de fluxo de caixa
  const { data: cashFlowProjection } = useQuery({
    queryKey: ["financial-cash-flow-projection", user?.id, profile?.role],
    queryFn: async ({ signal }) => {
      if (!user) throw new Error("Usuário não autenticado");

      const now = new Date();
      const projectionData: CashFlowProjection[] = [];

      // Buscar saldo inicial - RLS handles organization filtering
      const accountsQuery = supabase
        .from("financial_accounts")
        .select("current_balance")
        .eq("is_active", true);

      const accountsResult = await supabaseQueryWithTimeout(accountsQuery as any, undefined, signal);
      const { data: accounts } = accountsResult;
      const accountsData = (accounts || []) as Array<{ current_balance: number }>;

      let runningBalance = accountsData.reduce((sum, acc) => sum + (acc.current_balance || 0), 0);

      // Últimos 5 meses (real)
      for (let i = 4; i >= 0; i--) {
        const monthDate = subMonths(now, i);
        projectionData.push({
          month: format(monthDate, "MMM"),
          saldo: runningBalance,
          projected: false,
        });
      }

      // Calcular média de lucro dos últimos 3 meses para projeção
      const avgProfit = (monthlyData?.slice(-3) || []).reduce((sum, m) => sum + m.lucro, 0) / 3 || 0;

      // Próximos 2 meses (projetado)
      for (let i = 1; i <= 2; i++) {
        const futureMonth = addMonths(now, i);
        runningBalance += avgProfit;

        projectionData.push({
          month: format(futureMonth, "MMM"),
          saldo: runningBalance,
          projected: true,
        });
      }

      return projectionData;
    },
    enabled: !!user && !!profile && !!monthlyData,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: 1,
    retryDelay: 2000,
  });

  return {
    metrics,
    monthlyData,
    expensesByCategory,
    costsBreakdown,
    cashFlowProjection,
    isLoading,
    error,
  };
};

