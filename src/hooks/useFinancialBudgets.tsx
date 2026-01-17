import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useToast } from "./use-toast";
import { useUserProfile } from "./useUserProfile";
import type {
    FinancialBudget,
    FinancialBudgetInsert,
    FinancialBudgetUpdate,
} from "@/types/financial";

export interface BudgetWithSpent extends FinancialBudget {
    spent: number;
    category_name: string;
    category_color: string | null;
    percentage_used: number;
    remaining: number;
}

export const useFinancialBudgets = () => {
    const { user } = useAuth();
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const { profile } = useUserProfile();

    // Buscar todos os orçamentos com gastos calculados
    const { data: budgets, isLoading, error } = useQuery({
        queryKey: ["financial-budgets", user?.id, profile?.role],
        queryFn: async () => {
            if (!user) throw new Error("Usuário não autenticado");

            const isAdminOrDono = profile?.role === 'admin' || profile?.role === 'dono';

            // Buscar orçamentos com categoria
            let query = supabase
                .from("financial_budgets")
                .select(`
          *,
          category:financial_categories(id, name, color)
        `)
                .order("created_at", { ascending: false });

            if (!isAdminOrDono) {
                query = query.eq("user_id", user.id);
            }

            const { data: budgetsData, error: budgetsError } = await query;

            if (budgetsError) throw budgetsError;

            // Para cada orçamento, calcular o gasto
            const budgetsWithSpent: BudgetWithSpent[] = await Promise.all(
                (budgetsData || []).map(async (budget: any) => {
                    // Buscar soma de transações de saída da categoria no período
                    const { data: transactionsData } = await supabase
                        .from("financial_transactions")
                        .select("amount")
                        .eq("category_id", budget.category_id)
                        .eq("type", "saida")
                        .gte("transaction_date", budget.period_start)
                        .lte("transaction_date", budget.period_end);

                    const spent = transactionsData?.reduce((sum, t) => sum + (t.amount || 0), 0) || 0;
                    const percentage_used = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;
                    const remaining = budget.amount - spent;

                    return {
                        ...budget,
                        spent,
                        category_name: budget.category?.name || "Sem categoria",
                        category_color: budget.category?.color || "#3b82f6",
                        percentage_used,
                        remaining,
                    };
                })
            );

            return budgetsWithSpent;
        },
        enabled: !!user,
    });

    // Criar orçamento
    const createBudgetMutation = useMutation({
        mutationFn: async (budget: FinancialBudgetInsert) => {
            if (!user) throw new Error("Usuário não autenticado");

            const { data, error } = await supabase
                .from("financial_budgets")
                .insert({
                    ...budget,
                    user_id: user.id,
                })
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["financial-budgets"] });
            toast({
                title: "Orçamento criado",
                description: "Orçamento criado com sucesso!",
            });
        },
        onError: (error: Error) => {
            toast({
                variant: "destructive",
                title: "Erro ao criar orçamento",
                description: error.message,
            });
        },
    });

    // Atualizar orçamento
    const updateBudgetMutation = useMutation({
        mutationFn: async ({ id, updates }: { id: string; updates: FinancialBudgetUpdate }) => {
            if (!user) throw new Error("Usuário não autenticado");

            const isAdminOrDono = profile?.role === 'admin' || profile?.role === 'dono';

            let query = supabase
                .from("financial_budgets")
                .update(updates)
                .eq("id", id);

            if (!isAdminOrDono) {
                query = query.eq("user_id", user.id);
            }

            const { data, error } = await query.select().single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["financial-budgets"] });
            toast({
                title: "Orçamento atualizado",
                description: "Orçamento atualizado com sucesso!",
            });
        },
        onError: (error: Error) => {
            toast({
                variant: "destructive",
                title: "Erro ao atualizar orçamento",
                description: error.message,
            });
        },
    });

    // Deletar orçamento
    const deleteBudgetMutation = useMutation({
        mutationFn: async (id: string) => {
            if (!user) throw new Error("Usuário não autenticado");

            const isAdminOrDono = profile?.role === 'admin' || profile?.role === 'dono';

            let query = supabase
                .from("financial_budgets")
                .delete()
                .eq("id", id);

            if (!isAdminOrDono) {
                query = query.eq("user_id", user.id);
            }

            const { error } = await query;

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["financial-budgets"] });
            toast({
                title: "Orçamento removido",
                description: "Orçamento removido com sucesso!",
            });
        },
        onError: (error: Error) => {
            toast({
                variant: "destructive",
                title: "Erro ao remover orçamento",
                description: error.message,
            });
        },
    });

    // Calcular totais
    const totalBudget = budgets?.reduce((sum, b) => sum + (b.amount || 0), 0) || 0;
    const totalSpent = budgets?.reduce((sum, b) => sum + (b.spent || 0), 0) || 0;
    const totalRemaining = totalBudget - totalSpent;
    const overallPercentage = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

    return {
        budgets,
        isLoading,
        error,
        totalBudget,
        totalSpent,
        totalRemaining,
        overallPercentage,
        createBudget: createBudgetMutation.mutate,
        updateBudget: updateBudgetMutation.mutateAsync,
        deleteBudget: deleteBudgetMutation.mutateAsync,
        isCreating: createBudgetMutation.isPending,
        isUpdating: updateBudgetMutation.isPending,
        isDeleting: deleteBudgetMutation.isPending,
    };
};
