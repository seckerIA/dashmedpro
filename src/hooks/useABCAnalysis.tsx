
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export type ABCClass = "A" | "B" | "C";

export type ABCItem = {
    itemId: string;
    itemName: string;
    category: string;
    currentStock: number;
    unit: string;
    sellPrice: number;
    stockValue: number;
    percentageOfTotal: number;
    cumulativePercentage: number;
    abcClass: ABCClass;
};

export type ABCSummary = {
    totalValue: number;
    classA: {
        items: number;
        value: number;
        percentage: number;
    };
    classB: {
        items: number;
        value: number;
        percentage: number;
    };
    classC: {
        items: number;
        value: number;
        percentage: number;
    };
    items: ABCItem[];
};

const getABCClass = (cumulativePercentage: number): ABCClass => {
    if (cumulativePercentage <= 80) return "A";
    if (cumulativePercentage <= 95) return "B";
    return "C";
};

export function useABCAnalysis() {
    const { user } = useAuth();

    const abcQuery = useQuery({
        queryKey: ["abc-analysis", user?.id],
        queryFn: async (): Promise<ABCSummary> => {
            // Buscar todos os itens com seus lotes ativos
            const { data: itemsData, error: itemsError } = await supabase
                .from("inventory_items")
                .select(`
          id,
          name,
          category,
          unit,
          sell_price,
          inventory_batches (
            quantity,
            is_active
          )
        `);

            if (itemsError) throw itemsError;

            const items = (itemsData || []) as any[];

            // Calcular valor em estoque de cada item
            const itemsWithValue = items.map(item => {
                const batches = (item.inventory_batches || []).filter((b: any) => b.is_active);
                const currentStock = batches.reduce((sum: number, b: any) => sum + (b.quantity || 0), 0);
                const stockValue = currentStock * (item.sell_price || 0);

                return {
                    itemId: item.id,
                    itemName: item.name,
                    category: item.category || "Sem Categoria",
                    currentStock,
                    unit: item.unit || "un",
                    sellPrice: item.sell_price || 0,
                    stockValue,
                };
            }).filter(item => item.stockValue > 0); // Apenas itens com valor

            // Ordenar por valor decrescente
            itemsWithValue.sort((a, b) => b.stockValue - a.stockValue);

            // Calcular total
            const totalValue = itemsWithValue.reduce((sum, item) => sum + item.stockValue, 0);

            // Calcular percentuais e classificação ABC
            let cumulative = 0;
            const classifiedItems: ABCItem[] = itemsWithValue.map(item => {
                const percentageOfTotal = totalValue > 0 ? (item.stockValue / totalValue) * 100 : 0;
                cumulative += percentageOfTotal;
                const abcClass = getABCClass(cumulative);

                return {
                    ...item,
                    percentageOfTotal,
                    cumulativePercentage: cumulative,
                    abcClass,
                };
            });

            // Resumo por classe
            const classA = classifiedItems.filter(i => i.abcClass === "A");
            const classB = classifiedItems.filter(i => i.abcClass === "B");
            const classC = classifiedItems.filter(i => i.abcClass === "C");

            return {
                totalValue,
                classA: {
                    items: classA.length,
                    value: classA.reduce((sum, i) => sum + i.stockValue, 0),
                    percentage: classA.length > 0 ? (classA.length / classifiedItems.length) * 100 : 0,
                },
                classB: {
                    items: classB.length,
                    value: classB.reduce((sum, i) => sum + i.stockValue, 0),
                    percentage: classB.length > 0 ? (classB.length / classifiedItems.length) * 100 : 0,
                },
                classC: {
                    items: classC.length,
                    value: classC.reduce((sum, i) => sum + i.stockValue, 0),
                    percentage: classC.length > 0 ? (classC.length / classifiedItems.length) * 100 : 0,
                },
                items: classifiedItems,
            };
        },
        enabled: !!user,
        refetchInterval: 300000, // 5 minutos
        staleTime: 120000,
    });

    return {
        summary: abcQuery.data,
        items: abcQuery.data?.items || [],
        isLoading: abcQuery.isLoading,
        refetch: abcQuery.refetch,
    };
}
