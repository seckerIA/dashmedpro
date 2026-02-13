import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { addDays, differenceInDays } from "date-fns";
import { createVisibilityAwareInterval } from "@/lib/queryUtils";
import { supabaseQueryWithTimeout } from "@/utils/supabaseQuery";

const fromTable = (table: string) => (supabase.from(table as any) as any);

export type InventoryAlert = {
    id: string;
    type: "critical" | "warning" | "low_stock" | "expired";
    itemName: string;
    batchNumber: string;
    quantity: number;
    expirationDate: Date | null;
    daysUntilExpiry: number | null;
    message: string;
};

export type CategoryDistribution = {
    category: string;
    value: number;
    count: number;
};

export type DashboardMetrics = {
    totalCostValue: number;
    totalSellValue: number;
    potentialMargin: number;
    totalItems: number;
    totalBatches: number;
    lowStockCount: number;
    expiringCount: number;
    expiredCount: number;
    categoryDistribution: CategoryDistribution[];
    alerts: InventoryAlert[];
    recentMovements: number;
};

export function useInventoryDashboard() {
    const { user } = useAuth();

    const dashboardQuery = useQuery({
        queryKey: ["inventory-dashboard", user?.id],
        queryFn: async (): Promise<DashboardMetrics> => {
            const itemsQuery = fromTable("inventory_items")
                .select(`id, name, category, unit, min_stock, sell_price, inventory_batches (id, batch_number, quantity, expiration_date, is_active)`);

            const { data: itemsData, error: itemsError } = await supabaseQueryWithTimeout(itemsQuery, 20000);
            if (itemsError) throw itemsError;

            const items = (itemsData || []) as any[];
            const today = new Date();
            let totalCostValue = 0, totalSellValue = 0, totalBatches = 0, lowStockCount = 0, expiringCount = 0, expiredCount = 0;
            const alerts: InventoryAlert[] = [];
            const categoryMap = new Map<string, { value: number; count: number }>();

            for (const item of items) {
                const batches = (item.inventory_batches || []) as any[];
                let itemTotalQuantity = 0;

                for (const batch of batches) {
                    if (!batch.is_active) continue;
                    totalBatches++;
                    itemTotalQuantity += batch.quantity || 0;
                    const estimatedCost = (item.sell_price || 0) * 0.6;
                    totalCostValue += (batch.quantity || 0) * estimatedCost;
                    totalSellValue += (batch.quantity || 0) * (item.sell_price || 0);

                    if (batch.expiration_date) {
                        const expDate = new Date(batch.expiration_date);
                        const daysUntil = differenceInDays(expDate, today);
                        if (daysUntil < 0) { expiredCount++; alerts.push({ id: batch.id, type: "expired", itemName: item.name, batchNumber: batch.batch_number, quantity: batch.quantity, expirationDate: expDate, daysUntilExpiry: daysUntil, message: `Lote vencido há ${Math.abs(daysUntil)} dias` }); }
                        else if (daysUntil <= 7) { expiringCount++; alerts.push({ id: batch.id, type: "critical", itemName: item.name, batchNumber: batch.batch_number, quantity: batch.quantity, expirationDate: expDate, daysUntilExpiry: daysUntil, message: `Vence em ${daysUntil} dias` }); }
                        else if (daysUntil <= 30) { expiringCount++; alerts.push({ id: batch.id, type: "warning", itemName: item.name, batchNumber: batch.batch_number, quantity: batch.quantity, expirationDate: expDate, daysUntilExpiry: daysUntil, message: `Vence em ${daysUntil} dias` }); }
                    }
                }

                if (itemTotalQuantity <= item.min_stock) {
                    lowStockCount++;
                    alerts.push({ id: item.id, type: "low_stock", itemName: item.name, batchNumber: "-", quantity: itemTotalQuantity, expirationDate: null, daysUntilExpiry: null, message: `Estoque: ${itemTotalQuantity}/${item.min_stock} (mínimo)` });
                }

                const category = item.category || "Sem Categoria";
                const existing = categoryMap.get(category) || { value: 0, count: 0 };
                categoryMap.set(category, { value: existing.value + (itemTotalQuantity * (item.sell_price || 0)), count: existing.count + 1 });
            }

            const thirtyDaysAgo = addDays(today, -30);
            const movementsQuery = fromTable("inventory_movements")
                .select("*", { count: "exact", head: true })
                .gte("created_at", thirtyDaysAgo.toISOString());

            const movResult = await supabaseQueryWithTimeout(movementsQuery, 15000) as any;
            const recentMovements = movResult?.count || 0;

            const alertPriority: Record<string, number> = { expired: 0, critical: 1, warning: 2, low_stock: 3 };
            alerts.sort((a, b) => alertPriority[a.type] - alertPriority[b.type]);

            return {
                totalCostValue, totalSellValue, potentialMargin: totalSellValue - totalCostValue,
                totalItems: items?.length || 0, totalBatches, lowStockCount, expiringCount, expiredCount,
                categoryDistribution: Array.from(categoryMap.entries()).map(([category, data]) => ({ category, value: data.value, count: data.count })),
                alerts, recentMovements,
            };
        },
        enabled: !!user,
        refetchInterval: createVisibilityAwareInterval(60000),
    });

    return { metrics: dashboardQuery.data, isLoading: dashboardQuery.isLoading, error: dashboardQuery.error, refetch: dashboardQuery.refetch };
}
