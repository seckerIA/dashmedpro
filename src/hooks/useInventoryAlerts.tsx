
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { differenceInDays } from "date-fns";
import { realtimeQueryOptions, createVisibilityAwareInterval, withQueryTimeout } from "@/lib/queryUtils";

export type AlertType = "expired" | "critical" | "warning" | "low_stock";

export type InventoryAlertItem = {
    id: string;
    type: AlertType;
    itemId: string;
    itemName: string;
    batchId?: string;
    batchNumber?: string;
    quantity: number;
    expirationDate: Date | null;
    daysUntilExpiry: number | null;
    message: string;
    severity: number; // 0 = mais grave
};

export type AlertsSummary = {
    total: number;
    expired: number;
    critical: number;
    warning: number;
    lowStock: number;
    alerts: InventoryAlertItem[];
};

export function useInventoryAlerts() {
    const { user } = useAuth();

    const alertsQuery = useQuery({
        queryKey: ["inventory-alerts", user?.id],
        queryFn: async (): Promise<AlertsSummary> => {
            return withQueryTimeout(async () => {
                // Parallelize fetching batches and items
                const [batchesResult, itemsResult] = await Promise.all([
                    supabase
                        .from("inventory_batches")
                        .select(`
                          id,
                          batch_number,
                          quantity,
                          expiration_date,
                          is_active,
                          inventory_items (
                            id,
                            name,
                            category
                          )
                        `)
                        .eq("is_active", true),

                    supabase
                        .from("inventory_items")
                        .select(`
                          id,
                          name,
                          min_stock,
                          inventory_batches (quantity, is_active)
                        `)
                ]);

                if (batchesResult.error) throw batchesResult.error;
                if (itemsResult.error) throw itemsResult.error;

                const batches = (batchesResult.data || []) as any[];
                const items = (itemsResult.data || []) as any[];
                const today = new Date();
                const alerts: InventoryAlertItem[] = [];

                let expiredCount = 0;
                let criticalCount = 0;
                let warningCount = 0;
                let lowStockCount = 0;

                // 1. Processar alertas de validade
                for (const batch of batches) {
                    if (!batch.expiration_date || batch.quantity <= 0) continue;

                    const expDate = new Date(batch.expiration_date);
                    const daysUntil = differenceInDays(expDate, today);
                    const itemInfo = batch.inventory_items || { id: "", name: "Desconhecido" };

                    if (daysUntil < 0) {
                        // Vencido
                        expiredCount++;
                        alerts.push({
                            id: `batch-${batch.id}`,
                            type: "expired",
                            itemId: itemInfo.id,
                            itemName: itemInfo.name,
                            batchId: batch.id,
                            batchNumber: batch.batch_number,
                            quantity: batch.quantity,
                            expirationDate: expDate,
                            daysUntilExpiry: daysUntil,
                            message: `Vencido há ${Math.abs(daysUntil)} dia${Math.abs(daysUntil) !== 1 ? 's' : ''}`,
                            severity: 0,
                        });
                    } else if (daysUntil <= 7) {
                        // Crítico - vence em até 7 dias
                        criticalCount++;
                        alerts.push({
                            id: `batch-${batch.id}`,
                            type: "critical",
                            itemId: itemInfo.id,
                            itemName: itemInfo.name,
                            batchId: batch.id,
                            batchNumber: batch.batch_number,
                            quantity: batch.quantity,
                            expirationDate: expDate,
                            daysUntilExpiry: daysUntil,
                            message: daysUntil === 0 ? "Vence hoje!" : `Vence em ${daysUntil} dia${daysUntil !== 1 ? 's' : ''}`,
                            severity: 1,
                        });
                    } else if (daysUntil <= 30) {
                        // Atenção - vence em até 30 dias
                        warningCount++;
                        alerts.push({
                            id: `batch-${batch.id}`,
                            type: "warning",
                            itemId: itemInfo.id,
                            itemName: itemInfo.name,
                            batchId: batch.id,
                            batchNumber: batch.batch_number,
                            quantity: batch.quantity,
                            expirationDate: expDate,
                            daysUntilExpiry: daysUntil,
                            message: `Vence em ${daysUntil} dias`,
                            severity: 2,
                        });
                    }
                }

                // 2. Processar alertas de estoque baixo
                for (const item of items) {
                    const activeBatches = (item.inventory_batches || []).filter((b: any) => b.is_active);
                    const totalQuantity = activeBatches.reduce((sum: number, b: any) => sum + (b.quantity || 0), 0);

                    if (totalQuantity <= item.min_stock) {
                        lowStockCount++;
                        alerts.push({
                            id: `item-${item.id}`,
                            type: "low_stock",
                            itemId: item.id,
                            itemName: item.name,
                            quantity: totalQuantity,
                            expirationDate: null,
                            daysUntilExpiry: null,
                            message: `Estoque: ${totalQuantity}/${item.min_stock}`,
                            severity: 3,
                        });
                    }
                }

                // Ordenar por severidade
                alerts.sort((a, b) => a.severity - b.severity);

                return {
                    total: alerts.length,
                    expired: expiredCount,
                    critical: criticalCount,
                    warning: warningCount,
                    lowStock: lowStockCount,
                    alerts,
                };
            }, 60000); // 60s timeout to avoid persistence of errors
        },
        enabled: !!user,
        refetchInterval: createVisibilityAwareInterval(60000), // Atualizar a cada 1 minuto (quando tab visível)
        placeholderData: keepPreviousData, // Manter dados anteriores durante refetch
        ...realtimeQueryOptions, // Aplicar configurações otimizadas
    });

    return {
        summary: alertsQuery.data,
        alerts: alertsQuery.data?.alerts || [],
        isLoading: alertsQuery.isLoading,
        refetch: alertsQuery.refetch,
        // Helpers
        hasAlerts: (alertsQuery.data?.total || 0) > 0,
        hasCritical: (alertsQuery.data?.expired || 0) + (alertsQuery.data?.critical || 0) > 0,
        criticalCount: (alertsQuery.data?.expired || 0) + (alertsQuery.data?.critical || 0),
        totalCount: alertsQuery.data?.total || 0,
    };
}
