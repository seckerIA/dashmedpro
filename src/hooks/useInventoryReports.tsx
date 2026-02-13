import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { subMonths, format } from "date-fns";
import { supabaseQueryWithTimeout } from "@/utils/supabaseQuery";

const fromTable = (table: string) => (supabase.from(table as any) as any);

export type MonthlyConsumption = {
    month: string;
    category: string;
    quantity: number;
    value: number;
};

export type CategorySummary = {
    category: string;
    totalQuantity: number;
    totalValue: number;
    averagePrice: number;
    itemCount: number;
};

export type ReplenishmentProjection = {
    itemId: string;
    itemName: string;
    category: string;
    currentStock: number;
    monthlyConsumption: number;
    daysUntilEmpty: number | null;
    suggestedOrder: number;
    urgency: "critical" | "warning" | "normal" | "safe";
};

export type LossReport = {
    month: string;
    totalLosses: number;
    lossValue: number;
    items: Array<{
        itemName: string;
        quantity: number;
        value: number;
        reason: string;
    }>;
};

export type ReportsSummary = {
    monthlyConsumption: MonthlyConsumption[];
    categorySummary: CategorySummary[];
    replenishmentProjections: ReplenishmentProjection[];
    lossReport: LossReport[];
    totalConsumptionValue: number;
    totalLossValue: number;
};

export function useInventoryReports() {
    const { user } = useAuth();

    const reportsQuery = useQuery({
        queryKey: ["inventory-reports", user?.id],
        queryFn: async (): Promise<ReportsSummary> => {
            const today = new Date();
            const sixMonthsAgo = subMonths(today, 6);

            const movementsQuery = fromTable("inventory_movements")
                .select(`id, type, quantity, description, created_at, inventory_batches (id, inventory_items (id, name, category, sell_price, unit))`)
                .gte("created_at", sixMonthsAgo.toISOString())
                .order("created_at", { ascending: false });

            const { data: movementsData, error: movementsError } = await supabaseQueryWithTimeout(movementsQuery, 25000);
            if (movementsError) throw movementsError;
            const movements = (movementsData || []) as any[];

            const itemsQuery = fromTable("inventory_items")
                .select(`id, name, category, sell_price, unit, min_stock, inventory_batches (quantity, is_active)`);

            const { data: itemsData, error: itemsError } = await supabaseQueryWithTimeout(itemsQuery, 20000);
            if (itemsError) throw itemsError;
            const items = (itemsData || []) as any[];

            const consumptionByMonthCategory = new Map<string, Map<string, { quantity: number; value: number }>>();
            const consumptionByItem = new Map<string, number>();
            let totalConsumptionValue = 0;
            const lossesByMonth = new Map<string, { total: number; value: number; items: any[] }>();
            let totalLossValue = 0;

            for (const mov of movements) {
                const itemInfo = mov.inventory_batches?.inventory_items;
                if (!itemInfo) continue;
                const monthKey = format(new Date(mov.created_at), "yyyy-MM");
                const category = itemInfo.category || "Sem Categoria";
                const quantity = Math.abs(mov.quantity || 0);
                const value = quantity * (itemInfo.sell_price || 0);

                if (mov.type === "OUT") {
                    if (!consumptionByMonthCategory.has(monthKey)) consumptionByMonthCategory.set(monthKey, new Map());
                    const monthMap = consumptionByMonthCategory.get(monthKey)!;
                    const existing = monthMap.get(category) || { quantity: 0, value: 0 };
                    monthMap.set(category, { quantity: existing.quantity + quantity, value: existing.value + value });
                    const itemConsumption = consumptionByItem.get(itemInfo.id) || 0;
                    consumptionByItem.set(itemInfo.id, itemConsumption + quantity);
                    totalConsumptionValue += value;
                } else if (mov.type === "LOSS") {
                    if (!lossesByMonth.has(monthKey)) lossesByMonth.set(monthKey, { total: 0, value: 0, items: [] });
                    const monthLoss = lossesByMonth.get(monthKey)!;
                    monthLoss.total += quantity; monthLoss.value += value;
                    monthLoss.items.push({ itemName: itemInfo.name, quantity, value, reason: mov.description || "Não especificado" });
                    totalLossValue += value;
                }
            }

            const monthlyConsumption: MonthlyConsumption[] = [];
            for (const [month, categories] of consumptionByMonthCategory.entries()) {
                for (const [category, data] of categories.entries()) {
                    monthlyConsumption.push({ month, category, quantity: data.quantity, value: data.value });
                }
            }

            const categorySummaryMap = new Map<string, CategorySummary>();
            for (const item of items) {
                const category = item.category || "Sem Categoria";
                const batches = (item.inventory_batches || []).filter((b: any) => b.is_active);
                const stock = batches.reduce((sum: number, b: any) => sum + (b.quantity || 0), 0);
                const value = stock * (item.sell_price || 0);
                const existing = categorySummaryMap.get(category) || { category, totalQuantity: 0, totalValue: 0, averagePrice: 0, itemCount: 0 };
                categorySummaryMap.set(category, { ...existing, totalQuantity: existing.totalQuantity + stock, totalValue: existing.totalValue + value, itemCount: existing.itemCount + 1 });
            }

            const categorySummary = Array.from(categorySummaryMap.values()).map(cat => ({ ...cat, averagePrice: cat.itemCount > 0 ? cat.totalValue / cat.totalQuantity : 0 }));

            const replenishmentProjections: ReplenishmentProjection[] = [];
            for (const item of items) {
                const batches = (item.inventory_batches || []).filter((b: any) => b.is_active);
                const currentStock = batches.reduce((sum: number, b: any) => sum + (b.quantity || 0), 0);
                const mc = (consumptionByItem.get(item.id) || 0) / 6;
                let daysUntilEmpty: number | null = null;
                let urgency: ReplenishmentProjection["urgency"] = "safe";
                if (mc > 0) { daysUntilEmpty = Math.round((currentStock / mc) * 30); if (daysUntilEmpty <= 7) urgency = "critical"; else if (daysUntilEmpty <= 30) urgency = "warning"; else if (daysUntilEmpty <= 60) urgency = "normal"; }
                else if (currentStock <= item.min_stock) urgency = "warning";
                const suggestedOrder = Math.max(0, Math.ceil(mc * 2 - currentStock));
                if (urgency !== "safe" || suggestedOrder > 0) {
                    replenishmentProjections.push({ itemId: item.id, itemName: item.name, category: item.category || "Sem Categoria", currentStock, monthlyConsumption: Math.round(mc * 10) / 10, daysUntilEmpty, suggestedOrder, urgency });
                }
            }

            const urgencyOrder: Record<string, number> = { critical: 0, warning: 1, normal: 2, safe: 3 };
            replenishmentProjections.sort((a, b) => urgencyOrder[a.urgency] - urgencyOrder[b.urgency]);

            const lossReport: LossReport[] = Array.from(lossesByMonth.entries()).map(([month, data]) => ({ month, totalLosses: data.total, lossValue: data.value, items: data.items })).sort((a, b) => b.month.localeCompare(a.month));

            return { monthlyConsumption, categorySummary, replenishmentProjections, lossReport, totalConsumptionValue, totalLossValue };
        },
        enabled: !!user,
        refetchInterval: 300000,
        staleTime: 120000,
    });

    return { data: reportsQuery.data, isLoading: reportsQuery.isLoading, refetch: reportsQuery.refetch };
}
