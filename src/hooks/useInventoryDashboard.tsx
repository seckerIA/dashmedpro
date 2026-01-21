
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { addDays, differenceInDays, startOfMonth, endOfMonth } from "date-fns";
import { createVisibilityAwareInterval } from "@/lib/queryUtils";

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
            // 1. Buscar todos os itens com seus lotes
            const { data: itemsData, error: itemsError } = await supabase
                .from("inventory_items")
                .select(`
          id,
          name,
          category,
          unit,
          min_stock,
          sell_price,
          inventory_batches (
            id,
            batch_number,
            quantity,
            expiration_date,
            is_active
          )
        `);

            if (itemsError) throw itemsError;

            // Cast para any para contornar limitações de tipagem do Supabase com joins
            const items = (itemsData || []) as any[];

            const today = new Date();
            let totalCostValue = 0;
            let totalSellValue = 0;
            let totalBatches = 0;
            let lowStockCount = 0;
            let expiringCount = 0;
            let expiredCount = 0;
            const alerts: InventoryAlert[] = [];
            const categoryMap = new Map<string, { value: number; count: number }>();

            // 2. Processar cada item e seus lotes
            for (const item of items) {
                const batches = (item.inventory_batches || []) as any[];
                let itemTotalQuantity = 0;


                for (const batch of batches) {
                    if (!batch.is_active) continue;

                    totalBatches++;
                    itemTotalQuantity += batch.quantity || 0;

                    // Calcular valor de custo (precisaria do preço de custo do lote - por enquanto usar sell_price * 0.6)
                    const estimatedCost = (item.sell_price || 0) * 0.6;
                    totalCostValue += (batch.quantity || 0) * estimatedCost;
                    totalSellValue += (batch.quantity || 0) * (item.sell_price || 0);

                    // Verificar validade
                    if (batch.expiration_date) {
                        const expDate = new Date(batch.expiration_date);
                        const daysUntil = differenceInDays(expDate, today);

                        if (daysUntil < 0) {
                            // Vencido
                            expiredCount++;
                            alerts.push({
                                id: batch.id,
                                type: "expired",
                                itemName: item.name,
                                batchNumber: batch.batch_number,
                                quantity: batch.quantity,
                                expirationDate: expDate,
                                daysUntilExpiry: daysUntil,
                                message: `Lote vencido há ${Math.abs(daysUntil)} dias`,
                            });
                        } else if (daysUntil <= 7) {
                            // Crítico
                            expiringCount++;
                            alerts.push({
                                id: batch.id,
                                type: "critical",
                                itemName: item.name,
                                batchNumber: batch.batch_number,
                                quantity: batch.quantity,
                                expirationDate: expDate,
                                daysUntilExpiry: daysUntil,
                                message: `Vence em ${daysUntil} dias`,
                            });
                        } else if (daysUntil <= 30) {
                            // Atenção
                            expiringCount++;
                            alerts.push({
                                id: batch.id,
                                type: "warning",
                                itemName: item.name,
                                batchNumber: batch.batch_number,
                                quantity: batch.quantity,
                                expirationDate: expDate,
                                daysUntilExpiry: daysUntil,
                                message: `Vence em ${daysUntil} dias`,
                            });
                        }
                    }
                }

                // Verificar estoque baixo
                if (itemTotalQuantity <= item.min_stock) {
                    lowStockCount++;
                    alerts.push({
                        id: item.id,
                        type: "low_stock",
                        itemName: item.name,
                        batchNumber: "-",
                        quantity: itemTotalQuantity,
                        expirationDate: null,
                        daysUntilExpiry: null,
                        message: `Estoque: ${itemTotalQuantity}/${item.min_stock} (mínimo)`,
                    });
                }

                // Distribuição por categoria
                const category = item.category || "Sem Categoria";
                const existing = categoryMap.get(category) || { value: 0, count: 0 };
                categoryMap.set(category, {
                    value: existing.value + (itemTotalQuantity * (item.sell_price || 0)),
                    count: existing.count + 1,
                });
            }

            // 3. Buscar movimentações recentes (últimos 30 dias)
            const thirtyDaysAgo = addDays(today, -30);
            const { count: recentMovements } = await supabase
                .from("inventory_movements")
                .select("*", { count: "exact", head: true })
                .gte("created_at", thirtyDaysAgo.toISOString());

            // Ordenar alertas por prioridade
            const alertPriority = { expired: 0, critical: 1, warning: 2, low_stock: 3 };
            alerts.sort((a, b) => alertPriority[a.type] - alertPriority[b.type]);

            return {
                totalCostValue,
                totalSellValue,
                potentialMargin: totalSellValue - totalCostValue,
                totalItems: items?.length || 0,
                totalBatches,
                lowStockCount,
                expiringCount,
                expiredCount,
                categoryDistribution: Array.from(categoryMap.entries()).map(([category, data]) => ({
                    category,
                    value: data.value,
                    count: data.count,
                })),
                alerts,
                recentMovements: recentMovements || 0,
            };
        },
        enabled: !!user,
        refetchInterval: createVisibilityAwareInterval(60000), // Atualizar a cada 1 minuto (quando tab visível)
    });

    return {
        metrics: dashboardQuery.data,
        isLoading: dashboardQuery.isLoading,
        error: dashboardQuery.error,
        refetch: dashboardQuery.refetch,
    };
}
