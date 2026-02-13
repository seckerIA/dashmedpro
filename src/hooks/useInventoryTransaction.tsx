
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useUserProfile } from "./useUserProfile";

const fromTable = (table: string) => (supabase.from(table as any) as any);

export type TransactionType = 'INBOUND_INVOICE' | 'OUTBOUND_SALE' | 'INTERNAL_USE' | 'ADJUSTMENT' | 'LOSS';

export type TransactionItemInput = {
    item_id: string;
    batch_id?: string;
    batch_number?: string;
    expiration_date?: Date;
    quantity: number;
    unit_price: number;
};

export type CreateTransactionParams = {
    type: TransactionType;
    supplier_id?: string;
    invoice_number?: string;
    transaction_date: Date;
    description?: string;
    items: TransactionItemInput[];
    createFinancialRecord?: boolean;
};

export function useInventoryTransaction() {
    const { user } = useAuth();
    const { profile } = useUserProfile();
    const queryClient = useQueryClient();

    const createTransaction = useMutation({
        mutationFn: async (params: CreateTransactionParams) => {
            if (!user?.id) throw new Error("Usuário não autenticado");

            const { data: transaction, error: transactionError } = await fromTable('inventory_transactions')
                .insert([{
                    user_id: user.id,
                    supplier_id: params.supplier_id,
                    type: params.type,
                    invoice_number: params.invoice_number,
                    transaction_date: params.transaction_date.toISOString(),
                    description: params.description,
                    total_amount: params.items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0),
                    status: 'COMPLETED',
                    created_by: user.id,
                    organization_id: (profile as any)?.organization_id
                }])
                .select()
                .single();

            if (transactionError) throw transactionError;

            for (const item of params.items) {
                let targetBatchId = item.batch_id;

                if (params.type === 'INBOUND_INVOICE' && !targetBatchId && item.batch_number) {
                    const { data: newBatch, error: batchError } = await fromTable('inventory_batches')
                        .insert([{
                            item_id: item.item_id,
                            batch_number: item.batch_number,
                            expiration_date: item.expiration_date?.toISOString().split('T')[0],
                            quantity: 0,
                            is_active: true,
                            organization_id: (profile as any)?.organization_id
                        }])
                        .select()
                        .single();

                    if (batchError) throw batchError;
                    if (!newBatch) throw new Error("Erro ao criar lote");
                    targetBatchId = (newBatch as any).id;
                }

                if (!targetBatchId) throw new Error("Batch ID inválido para o item " + item.item_id);
                if (!transaction) throw new Error("Transação não criada");

                const { error: itemError } = await fromTable('inventory_transaction_items')
                    .insert([{
                        transaction_id: (transaction as any).id,
                        item_id: item.item_id,
                        batch_id: targetBatchId,
                        quantity: item.quantity,
                        unit_price: item.unit_price,
                        organization_id: (profile as any)?.organization_id
                    }]);

                if (itemError) throw itemError;

                const movementType =
                    params.type === 'INBOUND_INVOICE' ? 'IN' :
                        params.type === 'OUTBOUND_SALE' ? 'OUT' :
                            params.type === 'INTERNAL_USE' ? 'OUT' :
                                params.type === 'LOSS' ? 'LOSS' : 'ADJUST';

                const multiplier = (movementType === 'IN' || (movementType === 'ADJUST' && item.quantity > 0)) ? 1 : -1;

                const { error: movementError } = await fromTable('inventory_movements')
                    .insert([{
                        batch_id: targetBatchId,
                        type: movementType,
                        quantity: Math.abs(item.quantity) * multiplier,
                        description: `Transação #${(transaction as any).invoice_number || (transaction as any).id.slice(0, 8)}`,
                        created_by: user.id,
                        organization_id: (profile as any)?.organization_id
                    }]);

                if (movementError) throw movementError;
            }

            if (params.createFinancialRecord && transaction) {
                const isExpense = params.type === 'INBOUND_INVOICE';
                const totalValue = params.items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);

                if (totalValue > 0) {
                    await fromTable('financial_transactions').insert([{
                        user_id: user.id,
                        type: isExpense ? 'saida' : 'entrada',
                        amount: totalValue,
                        description: `${isExpense ? 'Compra de Estoque' : 'Venda de Estoque'} - Nota ${params.invoice_number || ''}`,
                        status: 'pendente',
                        transaction_date: params.transaction_date.toISOString(),
                        organization_id: (profile as any)?.organization_id
                    }]);
                }
            }

            return transaction;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["inventory-items"] });
            queryClient.invalidateQueries({ queryKey: ["inventory-batches"] });
            queryClient.invalidateQueries({ queryKey: ["inventory-transactions"] });
            queryClient.invalidateQueries({ queryKey: ["financial-transactions"] });
        }
    });

    return { createTransaction };
}
