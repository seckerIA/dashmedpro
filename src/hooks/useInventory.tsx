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

    // Buscar Items (com batches e saldo total)
    const { data: items, isLoading } = useQuery({
        queryKey: ["inventory-items"],
        queryFn: async ({ signal }) => {
            // Busca items com timeout
            const query = supabase
                .from("inventory_items")
                .select(`
                    *,
                    batches:inventory_batches(*)
                `)
                .order("name");

            const { data: itemsData, error: itemsError } = await supabaseQueryWithTimeout(
                query as any,
                15000,
                signal
            );

            if (itemsError) throw itemsError;

            // Calcular saldo total no frontend
            const itemsWithTotal = ((itemsData as any[]) || []).map((item: any) => ({
                ...item,
                total_quantity: item.batches?.reduce((acc: number, batch: any) => acc + (batch.quantity || 0), 0) || 0
            }));

            return itemsWithTotal as InventoryItem[];
        },
        enabled: !!user,
        staleTime: 60 * 1000,
        retry: 2,
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

    // Excluir Item
    const deleteItem = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase
                .from("inventory_items")
                .delete()
                .eq("id", id);
            if (error) throw error;
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
