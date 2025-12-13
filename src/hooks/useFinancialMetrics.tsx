import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useUserProfile } from "./useUserProfile";
import type {
  FinancialMetrics,
  MonthlyData,
  CategoryExpense,
  CashFlowProjection,
  CostBreakdown
} from "@/types/financial";
import { useCostsBreakdown } from "./useTransactionCosts";
import { startOfMonth, endOfMonth, subMonths, format, addMonths } from "date-fns";

export const useFinancialMetrics = () => {
  const { user } = useAuth();
  const { profile } = useUserProfile();
  
  const now = new Date();
  const currentMonthStart = startOfMonth(now);
  const currentMonthEnd = endOfMonth(now);
  
  // Buscar breakdown de custos do mês atual
  const { data: costsBreakdown } = useCostsBreakdown(
    format(currentMonthStart, "yyyy-MM-dd"),
    format(currentMonthEnd, "yyyy-MM-dd")
  );

  const { data: metrics, isLoading, error } = useQuery({
    queryKey: ["financial-metrics", user?.id, profile?.role],
    queryFn: async () => {
      if (!user) throw new Error("Usuário não autenticado");

      // Admin e Dono veem dados de TODOS os usuários
      const isAdminOrDono = profile?.role === 'admin' || profile?.role === 'dono';

      // 1. Buscar todas as contas ativas
      let accountsQuery = supabase
        .from("financial_accounts")
        .select("current_balance")
        .eq("is_active", true);

      if (!isAdminOrDono) {
        accountsQuery = accountsQuery.eq("user_id", user.id);
      }

      const { data: accounts } = await accountsQuery;
      const totalBalance = accounts?.reduce((sum, acc) => sum + (acc.current_balance || 0), 0) || 0;

      // 2. Buscar transações do mês atual (com custos)
      let transactionsQuery = supabase
        .from("financial_transactions")
        .select("type, amount, status, total_costs, has_costs")
        .eq("status", "concluida")
        .gte("transaction_date", format(currentMonthStart, "yyyy-MM-dd"))
        .lte("transaction_date", format(currentMonthEnd, "yyyy-MM-dd"));

      if (!isAdminOrDono) {
        transactionsQuery = transactionsQuery.eq("user_id", user.id);
      }

      const { data: currentMonthTransactions } = await transactionsQuery;

      const monthRevenue = currentMonthTransactions
        ?.filter(t => t.type === "entrada")
        .reduce((sum, t) => sum + t.amount, 0) || 0;

      const monthExpenses = currentMonthTransactions
        ?.filter(t => t.type === "saida")
        .reduce((sum, t) => sum + t.amount, 0) || 0;

      // Calcular custos totais (apenas de entradas)
      const monthTotalCosts = currentMonthTransactions
        ?.filter(t => t.type === "entrada" && t.has_costs)
        .reduce((sum, t) => sum + (t.total_costs || 0), 0) || 0;

      // Lucro bruto (receitas - despesas)
      const monthProfit = monthRevenue - monthExpenses;
      
      // Lucro líquido (receitas - despesas - custos)
      const monthNetProfit = monthRevenue - monthExpenses - monthTotalCosts;
      
      const profitMargin = monthRevenue > 0 ? (monthProfit / monthRevenue) * 100 : 0;
      const netProfitMargin = monthRevenue > 0 ? (monthNetProfit / monthRevenue) * 100 : 0;

      // 3. Contar transações ativas
      let countQuery = supabase
        .from("financial_transactions")
        .select("*", { count: "exact", head: true })
        .eq("status", "concluida");

      if (!isAdminOrDono) {
        countQuery = countQuery.eq("user_id", user.id);
      }

      const { count: activeTransactions } = await countQuery;

      const metricsData: FinancialMetrics = {
        totalBalance,
        monthRevenue,
        monthExpenses,
        monthProfit,
        profitMargin,
        totalAccounts: accounts?.length || 0,
        activeTransactions: activeTransactions || 0,
        monthTotalCosts,
        monthNetProfit,
        netProfitMargin,
      };

      return metricsData;
    },
    enabled: !!user,
  });

  // Dados mensais dos últimos 5 meses
  const { data: monthlyData } = useQuery({
    queryKey: ["financial-monthly-data", user?.id, profile?.role],
    queryFn: async () => {
      if (!user) throw new Error("Usuário não autenticado");

      const isAdminOrDono = profile?.role === 'admin' || profile?.role === 'dono';
      const now = new Date();
      const monthlyResults: MonthlyData[] = [];

      for (let i = 4; i >= 0; i--) {
        const monthDate = subMonths(now, i);
        const monthStart = startOfMonth(monthDate);
        const monthEnd = endOfMonth(monthDate);

        let query = supabase
          .from("financial_transactions")
          .select("type, amount")
          .eq("status", "concluida")
          .gte("transaction_date", format(monthStart, "yyyy-MM-dd"))
          .lte("transaction_date", format(monthEnd, "yyyy-MM-dd"));

        if (!isAdminOrDono) {
          query = query.eq("user_id", user.id);
        }

        const { data } = await query;

        const receitas = data?.filter(t => t.type === "entrada").reduce((sum, t) => sum + t.amount, 0) || 0;
        const despesas = data?.filter(t => t.type === "saida").reduce((sum, t) => sum + t.amount, 0) || 0;

        monthlyResults.push({
          month: format(monthDate, "MMM"),
          receitas,
          despesas,
          lucro: receitas - despesas,
        });
      }

      return monthlyResults;
    },
    enabled: !!user,
  });

  // Despesas por categoria (mês atual)
  const { data: expensesByCategory } = useQuery({
    queryKey: ["financial-expenses-by-category", user?.id, profile?.role],
    queryFn: async () => {
      if (!user) throw new Error("Usuário não autenticado");

      const isAdminOrDono = profile?.role === 'admin' || profile?.role === 'dono';
      const now = new Date();
      const monthStart = startOfMonth(now);
      const monthEnd = endOfMonth(now);

      let query = supabase
        .from("financial_transactions")
        .select(`
          amount,
          category:financial_categories(name, color)
        `)
        .eq("type", "saida")
        .eq("status", "concluida")
        .gte("transaction_date", format(monthStart, "yyyy-MM-dd"))
        .lte("transaction_date", format(monthEnd, "yyyy-MM-dd"));

      if (!isAdminOrDono) {
        query = query.eq("user_id", user.id);
      }

      const { data } = await query;

      // Agrupar por categoria
      const grouped = data?.reduce((acc, transaction) => {
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

      const result = Object.values(grouped || {});
      const total = result.reduce((sum, cat) => sum + cat.value, 0);

      // Calcular porcentagens
      result.forEach(cat => {
        cat.percentage = total > 0 ? (cat.value / total) * 100 : 0;
      });

      return result.sort((a, b) => b.value - a.value);
    },
    enabled: !!user,
  });

  // Projeção de fluxo de caixa
  const { data: cashFlowProjection } = useQuery({
    queryKey: ["financial-cash-flow-projection", user?.id, profile?.role],
    queryFn: async () => {
      if (!user) throw new Error("Usuário não autenticado");

      const isAdminOrDono = profile?.role === 'admin' || profile?.role === 'dono';
      const now = new Date();
      const projectionData: CashFlowProjection[] = [];

      // Buscar saldo inicial
      let accountsQuery = supabase
        .from("financial_accounts")
        .select("current_balance")
        .eq("is_active", true);

      if (!isAdminOrDono) {
        accountsQuery = accountsQuery.eq("user_id", user.id);
      }

      const { data: accounts } = await accountsQuery;

      let runningBalance = accounts?.reduce((sum, acc) => sum + (acc.current_balance || 0), 0) || 0;

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
      const avgProfit = monthlyData?.slice(-3).reduce((sum, m) => sum + m.lucro, 0) / 3 || 0;

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
    enabled: !!user && !!monthlyData,
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

