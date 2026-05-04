import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useUserProfile } from "./useUserProfile";
import type {
  FinancialMetrics,
  MonthlyData,
  CategoryExpense,
  CashFlowProjection,
} from "@/types/financial";
import { startOfDay, endOfDay, isSameMonth, subMonths, startOfMonth, endOfMonth, format, addMonths } from "date-fns";
import { getMonthlyMarketingFixedCostsTotalBrl } from "@/constants/monthlyMarketingFixedCosts";
import { useCostsBreakdown } from "./useTransactionCosts";
import { useMemo } from "react";

/**
 * Intervalo efetivo das métricas: no mesmo mês civil, soma do dia 1 até a data final (MTD);
 * em intervalos que cruzam meses, usa exatamente [from, to] ordenado.
 */
function resolveDashboardTransactionBounds(filters?: { startDate?: Date; endDate?: Date }) {
  const now = new Date();
  let rawFrom = filters?.startDate;
  let rawTo = filters?.endDate ?? filters?.startDate;
  if (!rawFrom && !rawTo) {
    rawFrom = startOfMonth(now);
    rawTo = endOfMonth(now);
  } else if (!rawFrom) {
    rawFrom = rawTo!;
  } else if (!rawTo) {
    rawTo = rawFrom;
  }

  let rangeStart = rawFrom <= rawTo ? rawFrom : rawTo;
  let rangeEnd = rawFrom <= rawTo ? rawTo : rawFrom;

  if (isSameMonth(rangeStart, rangeEnd)) {
    rangeStart = startOfMonth(rangeEnd);
  }

  return {
    rangeStart: startOfDay(rangeStart),
    rangeEnd: startOfDay(rangeEnd),
    keyFrom: format(startOfDay(rangeStart), "yyyy-MM-dd"),
    keyTo: format(startOfDay(rangeEnd), "yyyy-MM-dd"),
  };
}

export const useFinancialMetrics = (filters?: { startDate?: Date; endDate?: Date }) => {
  const { user } = useAuth();
  const { profile } = useUserProfile();

  const bounds = useMemo(
    () => resolveDashboardTransactionBounds(filters),
    [filters?.startDate?.valueOf() ?? 0, filters?.endDate?.valueOf() ?? 0]
  );
  const { rangeStart, rangeEnd, keyFrom, keyTo } = bounds;

  // Buscar breakdown de custos do período selecionado (alinha ao mesmo intervalo do dashboard)
  const { data: costsBreakdown } = useCostsBreakdown(keyFrom, keyTo);

  const { data: metrics, isLoading, error } = useQuery({
    queryKey: ["financial-metrics", user?.id, profile?.role, keyFrom, keyTo],
    queryFn: async () => {
      if (!user) throw new Error("Usuário não autenticado");

      // 1. Buscar todas as contas ativas (RLS will filter by organization)
      const { data: accounts } = await supabase
        .from("financial_accounts")
        .select("current_balance")
        .eq("is_active", true);

      const accountsData = (accounts || []) as Array<{ current_balance: number }>;
      const totalBalance = accountsData.reduce((sum, acc) => sum + (acc.current_balance || 0), 0);

      const rangeFromStr = format(rangeStart, "yyyy-MM-dd");
      const rangeToStr = format(rangeEnd, "yyyy-MM-dd");

      // 2. Transações no período efetivo (MTD no mesmo mês ou intervalo escolhido)
      const { data: currentMonthTransactions } = await supabase
        .from("financial_transactions")
        .select(`
          type,
          amount,
          status,
          total_costs,
          has_costs,
          category:financial_categories(is_fixed)
        `)
        .eq("status", "concluida")
        .gte("transaction_date", rangeFromStr)
        .lte("transaction_date", rangeToStr);

      const transactionsData = (currentMonthTransactions || []) as Array<{
        type: string;
        amount: number;
        has_costs?: boolean;
        total_costs?: number;
        category?: { is_fixed: boolean | null } | null;
      }>;

      const monthRevenue = transactionsData
        .filter(t => t.type === "entrada")
        .reduce((sum, t) => sum + (t.amount || 0), 0);

      const isFixedSaida = (t: (typeof transactionsData)[0]) =>
        t.type === "saida" && t.category?.is_fixed === true;

      const monthExpenses = transactionsData
        .filter(t => t.type === "saida" && !isFixedSaida(t))
        .reduce((sum, t) => sum + (t.amount || 0), 0);

      const calMonthStart = startOfMonth(rangeEnd);
      const calMonthEnd = endOfMonth(rangeEnd);

      // Custos fixos cadastrados (categoria is_fixed) — mês civil inteiro da data final do filtro
      const { data: fixedCategoryFullMonth } = await supabase
        .from("financial_transactions")
        .select(`
          amount,
          category:financial_categories!inner(is_fixed)
        `)
        .eq("type", "saida")
        .eq("status", "concluida")
        .eq("financial_categories.is_fixed", true)
        .gte("transaction_date", format(calMonthStart, "yyyy-MM-dd"))
        .lte("transaction_date", format(calMonthEnd, "yyyy-MM-dd"));

      const monthFixedCategoryTotal = (fixedCategoryFullMonth || []).reduce(
        (sum, t: any) => sum + (t.amount || 0),
        0
      );

      // 2.1 Buscar transações de HOJE para receita do dia
      const today = new Date();
      const todayStart = format(startOfDay(today), "yyyy-MM-dd");
      const todayEnd = format(endOfDay(today), "yyyy-MM-dd");

      const { data: todayTransactions } = await supabase
        .from("financial_transactions")
        .select("type, amount, status")
        .eq("status", "concluida")
        .eq("type", "entrada")
        .gte("transaction_date", todayStart)
        .lte("transaction_date", todayEnd);

      const todayData = (todayTransactions || []) as Array<{ type: string; amount: number }>;
      const todayRevenue = todayData.reduce((sum, t) => sum + (t.amount || 0), 0);

      // 3. Marketing mensal planejado (valor fixo do mês)
      const totalMarketingSpend = getMonthlyMarketingFixedCostsTotalBrl();

      // Calcular custos totais (apenas de entradas - custos variáveis diretos)
      const monthTotalCosts = transactionsData
        .filter(t => t.type === "entrada" && t.has_costs)
        .reduce((sum, t) => sum + (t.total_costs || 0), 0);

      // Lucro após despesas variáveis (antes de fixos planejados e custos de entrada)
      const monthProfit = monthRevenue - monthExpenses;

      // Custos fixos exibidos: despesas fixas do mês civil + planejamento de marketing
      const monthFixedCosts = monthFixedCategoryTotal + totalMarketingSpend;

      // Lucro líquido = receita no período − despesas variáveis − custos nas entradas − custos fixos mensais
      const monthNetProfit = monthRevenue - monthExpenses - monthTotalCosts - monthFixedCosts;

      const profitMargin = monthRevenue > 0 ? (monthProfit / monthRevenue) * 100 : 0;
      const netProfitMargin = monthRevenue > 0 ? (monthNetProfit / monthRevenue) * 100 : 0;

      // Receita no mesmo recorte do mês anterior (MTD espelhado)
      let monthRevenuePreviousPeriod = 0;
      const prevMonthEnd = subMonths(rangeEnd, 1);
      const prevMonthStart = startOfMonth(prevMonthEnd);
      if (rangeFromStr === format(startOfMonth(rangeEnd), "yyyy-MM-dd")) {
        const prevFromStr = format(prevMonthStart, "yyyy-MM-dd");
        const prevToStr = format(prevMonthEnd, "yyyy-MM-dd");
        const { data: prevRows } = await supabase
          .from("financial_transactions")
          .select("type, amount")
          .eq("status", "concluida")
          .eq("type", "entrada")
          .gte("transaction_date", prevFromStr)
          .lte("transaction_date", prevToStr);
        monthRevenuePreviousPeriod = (prevRows || []).reduce(
          (sum, t: { amount?: number }) => sum + (t.amount || 0),
          0
        );
      }

      // 5. Contar transações ativas
      const { count: activeTransactions } = await supabase
        .from("financial_transactions")
        .select("*", { count: "exact", head: true })
        .eq("status", "concluida");

      const metricsData: FinancialMetrics = {
        totalBalance,
        monthRevenue,
        monthExpenses,
        monthProfit,
        profitMargin,
        totalAccounts: accountsData?.length || 0,
        activeTransactions: activeTransactions || 0,
        monthTotalCosts, // Custos Variáveis
        monthFixedCosts, // Novo campo: Custos Fixos (Incluindo Marketing)
        monthNetProfit,
        netProfitMargin,
        todayRevenue,
        totalMarketingSpend,
        monthRevenuePreviousPeriod,
      };

      return metricsData;
    },
    enabled: !!user && !!profile,
    staleTime: 30 * 1000, // 30 segundos
    gcTime: 10 * 60 * 1000,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: 1,
    retryDelay: 2000,
  });

  // Dados mensais dos últimos 5 meses
  const { data: monthlyData } = useQuery({
    queryKey: ["financial-monthly-data", user?.id, profile?.role],
    queryFn: async () => {
      if (!user) throw new Error("Usuário não autenticado");

      const now = new Date();
      const monthlyResults: MonthlyData[] = [];

      for (let i = 4; i >= 0; i--) {
        const monthDate = subMonths(now, i);
        const monthStart = startOfMonth(monthDate);
        const monthEnd = endOfMonth(monthDate);

        const { data } = await supabase
          .from("financial_transactions")
          .select("type, amount")
          .eq("status", "concluida")
          .gte("transaction_date", format(monthStart, "yyyy-MM-dd"))
          .lte("transaction_date", format(monthEnd, "yyyy-MM-dd"));

        const transactionsData = (data || []) as Array<{ type: string; amount: number }>;

        const receitas = transactionsData.filter(t => t.type === "entrada").reduce((sum, t) => sum + (t.amount || 0), 0);
        const despesas = transactionsData.filter(t => t.type === "saida").reduce((sum, t) => sum + (t.amount || 0), 0);

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
    staleTime: 30 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: 1,
    retryDelay: 2000,
  });

  // Despesas por categoria (período selecionado)
  const { data: expensesByCategory } = useQuery({
    queryKey: ["financial-expenses-by-category", user?.id, profile?.role, keyFrom, keyTo],
    queryFn: async () => {
      if (!user) throw new Error("Usuário não autenticado");

      const { data } = await supabase
        .from("financial_transactions")
        .select(`
          amount,
          category:financial_categories(name, color)
        `)
        .eq("type", "saida")
        .eq("status", "concluida")
        .gte("transaction_date", keyFrom)
        .lte("transaction_date", keyTo);

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

        acc[categoryName].value += (transaction.amount || 0);
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
    staleTime: 30 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: 1,
    retryDelay: 2000,
  });

  // Projeção de fluxo de caixa
  const { data: cashFlowProjection } = useQuery({
    queryKey: ["financial-cash-flow-projection", user?.id, profile?.role],
    queryFn: async () => {
      if (!user) throw new Error("Usuário não autenticado");

      const now = new Date();
      const projectionData: CashFlowProjection[] = [];

      // Buscar saldo inicial - RLS handles organization filtering
      const { data: accounts } = await supabase
        .from("financial_accounts")
        .select("current_balance")
        .eq("is_active", true);

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
