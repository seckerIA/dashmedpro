
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { differenceInDays, subDays } from "date-fns";

export type TurnoverStatus = "high" | "medium" | "low" | "stale";

export type ItemTurnover = {
    itemId: string;
    itemName: string;
    category: string;
    currentStock: number;
    unit: string;
    sellPrice: number;
    stockValue: number;
    lastMovementDate: Date | null;
    daysSinceMovement: number | null;
    turnoverStatus: TurnoverStatus;
    monthlyConsumption: number;
    coverageMonths: number | null; // Quantos meses de estoque disponível
};

export type TurnoverSummary = {
    highGiro: number;
    mediumGiro: number;
    lowGiro: number;
    staleGiro: number;
    totalItems: number;
    staleValue: number; // Valor em R$ de produtos parados
    items: ItemTurnover[];
};

const getTurnoverStatus = (daysSinceMovement: number | null): TurnoverStatus => {
    if (daysSinceMovement === null) return "stale";
    if (daysSinceMovement <= 15) return "high";
    if (daysSinceMovement <= 45) return "medium";
    if (daysSinceMovement <= 90) return "low";
    return "stale";
};

export function useStockTurnover() {
    const { user } = useAuth();

    const turnoverQuery = useQuery({
        queryKey: ["stock-turnover", user?.id],
        queryFn: async (): Promise<TurnoverSummary> => {
            // 1. Buscar todos os itens com seus lotes
            const { data: itemsData, error: itemsError } = await (supabase
                .from("inventory_items" as any) as any)
                .select(`
          id,
          name,
          category,
          unit,
          sell_price,
          inventory_batches (
            id,
            quantity,
            is_active
          )
        `);

            if (itemsError) throw itemsError;

            const items = (itemsData || []) as any[];
            const today = new Date();
            const thirtyDaysAgo = subDays(today, 30);

            // 2. Buscar movimentações de saída (OUT, LOSS) dos últimos 30 dias por item
            const { data: movementsData, error: movementsError } = await (supabase
                .from("inventory_movements" as any) as any)
                .select(`
          id,
          batch_id,
          type,
          quantity,
          created_at,
          inventory_batches (
            item_id
          )
        `)
                .in("type", ["OUT", "LOSS"])
                .gte("created_at", thirtyDaysAgo.toISOString());

            if (movementsError) throw movementsError;

            const movements = (movementsData || []) as any[];

            // 3. Buscar última movimentação de cada item
            const { data: lastMovementsData, error: lastMovementsError } = await (supabase
                .from("inventory_movements" as any) as any)
                .select(`
          id,
          created_at,
          inventory_batches (
            item_id
          )
        `)
                .in("type", ["OUT", "LOSS"])
                .order("created_at", { ascending: false });

            if (lastMovementsError) throw lastMovementsError;

            const lastMovements = (lastMovementsData || []) as any[];

            // Mapear última movimentação por item
            const lastMovementByItem = new Map<string, Date>();
            for (const mov of lastMovements) {
                const itemId = mov.inventory_batches?.item_id;
                if (itemId && !lastMovementByItem.has(itemId)) {
                    lastMovementByItem.set(itemId, new Date(mov.created_at));
                }
            }

            // Calcular consumo mensal por item
            const monthlyConsumptionByItem = new Map<string, number>();
            for (const mov of movements) {
                const itemId = mov.inventory_batches?.item_id;
                if (itemId) {
                    const current = monthlyConsumptionByItem.get(itemId) || 0;
                    monthlyConsumptionByItem.set(itemId, current + Math.abs(mov.quantity || 0));
                }
            }

            // 4. Processar cada item
            const turnoverItems: ItemTurnover[] = [];
            let highGiro = 0;
            let mediumGiro = 0;
            let lowGiro = 0;
            let staleGiro = 0;
            let staleValue = 0;

            for (const item of items) {
                const batches = (item.inventory_batches || []).filter((b: any) => b.is_active);
                const currentStock = batches.reduce((sum: number, b: any) => sum + (b.quantity || 0), 0);
                const stockValue = currentStock * (item.sell_price || 0);

                const lastMovementDate = lastMovementByItem.get(item.id) || null;
                const daysSinceMovement = lastMovementDate
                    ? differenceInDays(today, lastMovementDate)
                    : null;

                const turnoverStatus = getTurnoverStatus(daysSinceMovement);
                const monthlyConsumption = monthlyConsumptionByItem.get(item.id) || 0;
                const coverageMonths = monthlyConsumption > 0
                    ? Math.round((currentStock / monthlyConsumption) * 10) / 10
                    : null;

                // Contar por status
                switch (turnoverStatus) {
                    case "high": highGiro++; break;
                    case "medium": mediumGiro++; break;
                    case "low": lowGiro++; break;
                    case "stale":
                        staleGiro++;
                        staleValue += stockValue;
                        break;
                }

                turnoverItems.push({
                    itemId: item.id,
                    itemName: item.name,
                    category: item.category || "Sem Categoria",
                    currentStock,
                    unit: item.unit || "un",
                    sellPrice: item.sell_price || 0,
                    stockValue,
                    lastMovementDate,
                    daysSinceMovement,
                    turnoverStatus,
                    monthlyConsumption,
                    coverageMonths,
                });
            }

            // Ordenar por dias parados (mais parados primeiro)
            turnoverItems.sort((a, b) => {
                if (a.daysSinceMovement === null && b.daysSinceMovement === null) return 0;
                if (a.daysSinceMovement === null) return -1;
                if (b.daysSinceMovement === null) return 1;
                return b.daysSinceMovement - a.daysSinceMovement;
            });

            return {
                highGiro,
                mediumGiro,
                lowGiro,
                staleGiro,
                totalItems: items.length,
                staleValue,
                items: turnoverItems,
            };
        },
        enabled: !!user,
        refetchInterval: 120000, // 2 minutos
        staleTime: 60000,
    });

    return {
        summary: turnoverQuery.data,
        items: turnoverQuery.data?.items || [],
        isLoading: turnoverQuery.isLoading,
        refetch: turnoverQuery.refetch,
    };
}
