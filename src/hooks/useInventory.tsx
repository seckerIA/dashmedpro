import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useUserProfile } from "./useUserProfile";
import { useToast } from "./use-toast";
import { InventoryItem, InventoryItemInsert, InventoryItemUpdate, InventoryBatch, InventoryBatchInsert, InventoryMovement } from "@/types/inventory";
import { supabaseQueryWithTimeout } from "@/utils/supabaseQuery";

const fromTable = (table: string) => (supabase.from(table as any) as any);

export const useInventory = () => {
    const { user } = useAuth();
    const { profile } = useUserProfile();
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const { data: items, isLoading } = useQuery({
        queryKey: ["inventory-items"],
        queryFn: async () => {
            const itemsQuery = fromTable("inventory_items")
                .select(`
                    *,
                    batches:inventory_batches(*),
                    supplier:inventory_suppliers(id, name)
                `)
                .order("name");

            const { data: itemsData, error: itemsError } = await supabaseQueryWithTimeout(itemsQuery, 20000);

            if (itemsError) throw itemsError;

            const itemsWithTotal = (itemsData as any[]).map((item: any) => ({
                ...item,
                total_quantity: item.batches?.reduce((acc: number, batch: any) => acc + (batch.quantity || 0), 0) || 0
            }));

            return itemsWithTotal as InventoryItem[];
        },
        enabled: !!user,
    });

    const createItem = useMutation({
        mutationFn: async (newItem: InventoryItemInsert) => {
            if (!user?.id) throw new Error("Usuário não autenticado");

            const { data, error } = await fromTable("inventory_items")
                .insert([{
                    ...newItem,
                    user_id: user.id,
                    organization_id: (profile as any)?.organization_id
                }])
                .select()
                .single();
            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["inventory-items"] });
            toast({ title: "Produto criado com sucesso" });
        },
        onError: (error) => {
            toast({ title: "Erro ao criar produto", description: error.message, variant: "destructive" });
        }
    });

    const updateItem = useMutation({
        mutationFn: async ({ id, updates }: { id: string, updates: InventoryItemUpdate }) => {
            const { data, error } = await fromTable("inventory_items")
                .update(updates)
                .eq("id", id)
                .select()
                .single();
            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["inventory-items"] });
            toast({ title: "Produto atualizado" });
        }
    });

    const addBatch = useMutation({
        mutationFn: async (batch: InventoryBatchInsert) => {
            const { data: newBatch, error: batchError } = await fromTable("inventory_batches")
                .insert([{
                    ...batch,
                    organization_id: (profile as any)?.organization_id
                }])
                .select()
                .single();

            if (batchError) throw batchError;

            if (newBatch) {
                const { error: moveError } = await fromTable("inventory_movements")
                    .insert([{
                        batch_id: (newBatch as any).id,
                        type: 'IN',
                        quantity: batch.quantity,
                        created_by: user?.id,
                        organization_id: (profile as any)?.organization_id,
                        description: 'Entrada Inicial de Lote'
                    }]);

                if (moveError) console.error("Erro ao criar movimento inicial", moveError);
            }

            return newBatch;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["inventory-items"] });
            toast({ title: "Lote adicionado com sucesso" });
        },
        onError: (error) => {
            toast({ title: "Erro ao adicionar lote", description: error.message, variant: "destructive" });
        }
    });

    const registerMovement = useMutation({
        mutationFn: async ({ batchId, type, quantity, description }: { batchId: string, type: 'IN' | 'OUT' | 'ADJUST' | 'LOSS', quantity: number, description?: string }) => {
            const { error } = await fromTable("inventory_movements")
                .insert([{
                    batch_id: batchId,
                    type,
                    quantity,
                    created_by: user?.id,
                    organization_id: (profile as any)?.organization_id,
                    description
                }]);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["inventory-items"] });
        },
        onError: (error) => {
            toast({ title: "Erro na movimentação", description: error.message, variant: "destructive" });
        }
    });

    const deleteItem = useMutation({
        mutationFn: async (id: string) => {
            const { data: batches } = await fromTable("inventory_batches")
                .select("id")
                .eq("item_id", id);

            if (batches && (batches as any[]).length > 0) {
                const batchIds = (batches as any[]).map((b: any) => b.id);

                // 1. Delete transactions items related to these batches
                await fromTable("inventory_transaction_items")
                    .delete()
                    .in("batch_id", batchIds);

                // 2. Delete movements related to these batches
                await fromTable("inventory_movements")
                    .delete()
                    .in("batch_id", batchIds);

                // 3. Delete stock usage related to this item
                await fromTable("appointment_stock_usage")
                    .delete()
                    .eq("inventory_item_id", id);

                // 4. Delete item-level transactions (if any directly point to item)
                await fromTable("inventory_transaction_items")
                    .delete()
                    .eq("item_id", id);

                // 5. Finally delete batches
                const { error: batchesError } = await fromTable("inventory_batches")
                    .delete()
                    .eq("item_id", id);

                if (batchesError) {
                    throw new Error("Erro ao excluir lotes do produto: " + batchesError.message);
                }
            } else {
                // If it has no batches, it might still have direct item references
                await fromTable("appointment_stock_usage")
                    .delete()
                    .eq("inventory_item_id", id);

                await fromTable("inventory_transaction_items")
                    .delete()
                    .eq("item_id", id);
            }

            const { data, error } = await fromTable("inventory_items")
                .delete()
                .eq("id", id)
                .select();

            if (error) throw error;

            if (!data || (data as any[]).length === 0) {
                throw new Error("Não foi possível excluir. Verifique se você tem permissão.");
            }

            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["inventory-items"] });
            toast({ title: "Produto excluído com sucesso" });
        },
        onError: (error) => {
            toast({ title: "Erro ao excluir produto", description: error.message, variant: "destructive" });
        }
    });

    return {
        items,
        isLoading,
        createItem,
        updateItem,
        deleteItem,
        addBatch,
        registerMovement
    };
};
