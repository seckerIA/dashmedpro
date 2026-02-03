import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useUserProfile } from "./useUserProfile";
import { useToast } from "./use-toast";
import { InventoryItem, InventoryItemInsert, InventoryItemUpdate, InventoryBatch, InventoryBatchInsert, InventoryMovement } from "@/types/inventory";
import { supabaseQueryWithTimeout } from "@/utils/supabaseQuery";

export const useInventory = () => {
    const { user } = useAuth();
    const { profile } = useUserProfile();
    const { toast } = useToast();
    const queryClient = useQueryClient();

    // Buscar Items (com batches, supplier e saldo total) - timeout: 20s
    const { data: items, isLoading } = useQuery({
        queryKey: ["inventory-items"],
        queryFn: async () => {
            // Busca items com timeout de 20s
            const itemsQuery = supabase
                .from("inventory_items")
                .select(`
                    *,
                    batches:inventory_batches(*),
                    supplier:inventory_suppliers(id, name)
                `)
                .order("name");

            const { data: itemsData, error: itemsError } = await supabaseQueryWithTimeout(itemsQuery as any, 20000);

            if (itemsError) throw itemsError;

            // Calcular saldo total no frontend
            const itemsWithTotal = itemsData.map((item: any) => ({
                ...item,
                total_quantity: item.batches?.reduce((acc: number, batch: any) => acc + (batch.quantity || 0), 0) || 0
            }));

            return itemsWithTotal as InventoryItem[];
        },
        enabled: !!user,
    });

    // Criar Item
    const createItem = useMutation({
        mutationFn: async (newItem: InventoryItemInsert) => {
            if (!user?.id) throw new Error("Usuário não autenticado");

            const { data, error } = await supabase
                .from("inventory_items")
                .insert([{ 
                    ...newItem, 
                    user_id: user.id,
                    organization_id: profile?.organization_id
                } as any])
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

    // Atualizar Item
    const updateItem = useMutation({
        mutationFn: async ({ id, updates }: { id: string, updates: InventoryItemUpdate }) => {
            const { data, error } = await supabase
                .from("inventory_items")
                .update(updates as any)
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

    // Adicionar Lote (Entrada)
    const addBatch = useMutation({
        mutationFn: async (batch: InventoryBatchInsert) => {
            // 1. Criar Lote
            const { data: newBatch, error: batchError } = await supabase
                .from("inventory_batches")
                .insert([{
                    ...batch,
                    organization_id: profile?.organization_id
                } as any])
                .select()
                .single();

            if (batchError) throw batchError;

            // 2. Registrar Movimento de Entrada (IN)
            if (newBatch) {
                const { error: moveError } = await supabase
                    .from("inventory_movements")
                    .insert([{
                        batch_id: newBatch.id,
                        type: 'IN',
                        quantity: batch.quantity,
                        created_by: user?.id,
                        organization_id: profile?.organization_id,
                        description: 'Entrada Inicial de Lote'
                    } as any]);

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

    // Ajuste/Movimentação Manual
    const registerMovement = useMutation({
        mutationFn: async ({ batchId, type, quantity, description }: { batchId: string, type: 'IN' | 'OUT' | 'ADJUST' | 'LOSS', quantity: number, description?: string }) => {
            // O trigger no banco vai atualizar o saldo do batch automaticamente
            const { error } = await supabase
                .from("inventory_movements")
                .insert([{
                    batch_id: batchId,
                    type,
                    quantity,
                    created_by: user?.id,
                    organization_id: profile?.organization_id,
                    description
                } as any]);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["inventory-items"] });
            // toast({ title: "Movimentação registrada" });
        },
        onError: (error) => {
            toast({ title: "Erro na movimentação", description: error.message, variant: "destructive" });
        }
    });

    // Excluir Item (com lotes e movimentações em cascata)
    const deleteItem = useMutation({
        mutationFn: async (id: string) => {
            // 1. Buscar todos os lotes do item
            const { data: batches } = await supabase
                .from("inventory_batches")
                .select("id")
                .eq("item_id", id);

            // 2. Deletar movimentações de todos os lotes
            if (batches && batches.length > 0) {
                const batchIds = batches.map(b => b.id);
                const { error: movementsError } = await supabase
                    .from("inventory_movements")
                    .delete()
                    .in("batch_id", batchIds);

                if (movementsError) {
                    console.error("Erro ao deletar movimentações:", movementsError);
                }

                // 3. Deletar os lotes
                const { error: batchesError } = await supabase
                    .from("inventory_batches")
                    .delete()
                    .eq("item_id", id);

                if (batchesError) {
                    throw new Error("Erro ao excluir lotes do produto: " + batchesError.message);
                }
            }

            // 4. Deletar o item
            const { data, error } = await supabase
                .from("inventory_items")
                .delete()
                .eq("id", id)
                .select();

            if (error) throw error;

            // Se data está vazio, nada foi deletado (RLS bloqueou)
            if (!data || data.length === 0) {
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
