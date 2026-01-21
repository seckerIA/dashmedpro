
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useUserProfile } from "./useUserProfile";

export type TransactionType = 'INBOUND_INVOICE' | 'OUTBOUND_SALE' | 'INTERNAL_USE' | 'ADJUSTMENT' | 'LOSS';

export type TransactionItemInput = {
    item_id: string;
    batch_id?: string; // Obrigatório para OUT/ADJUST/LOSS
    batch_number?: string; // Obrigatório para IN (se batch_id não pfornecido, cria novo)
    expiration_date?: Date; // Opcional, usado para criar lote
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
    createFinancialRecord?: boolean; // Se true, cria registro financeiro
};

export function useInventoryTransaction() {
    const { user } = useAuth();
    const { profile } = useUserProfile();
    const queryClient = useQueryClient();

    const createTransaction = useMutation({
        mutationFn: async (params: CreateTransactionParams) => {
            if (!user?.id) throw new Error("Usuário não autenticado");

            // 1. Criar Header da Transação
            const { data: transaction, error: transactionError } = await supabase
                .from('inventory_transactions')
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
                    organization_id: profile?.organization_id
                }])
                .select()
                .single();

            if (transactionError) throw transactionError;

            // 2. Processar Itens
            for (const item of params.items) {
                let targetBatchId = item.batch_id;

                // Se for Entrada (INBOUND) e não tiver batch_id, criar lote novo
                if (params.type === 'INBOUND_INVOICE' && !targetBatchId && item.batch_number) {
                    const { data: newBatch, error: batchError } = await supabase
                        .from('inventory_batches')
                        .insert([{
                            item_id: item.item_id,
                            batch_number: item.batch_number,
                            expiration_date: item.expiration_date?.toISOString().split('T')[0],
                            quantity: 0, // Será incrementado pelo trigger de movement
                            is_active: true,
                            organization_id: profile?.organization_id
                        }])
                        .select()
                        .single();

                    if (batchError) throw batchError;
                    if (!newBatch) throw new Error("Erro ao criar lote");
                    targetBatchId = newBatch.id;
                }

                if (!targetBatchId) throw new Error("Batch ID inválido para o item " + item.item_id);
                if (!transaction) throw new Error("Transação não criada");

                // Criar Inventory Transaction Item (Linha da Nota)
                const { error: itemError } = await supabase
                    .from('inventory_transaction_items')
                    .insert([{
                        transaction_id: transaction.id,
                        item_id: item.item_id,
                        batch_id: targetBatchId,
                        quantity: item.quantity,
                        unit_price: item.unit_price,
                        organization_id: profile?.organization_id
                    }]);

                if (itemError) throw itemError;

                // Criar Movimentação Física (Movement) - que dispara Trigger de Saldo
                // Para INBOUND, qtde é positiva. Para OUTBOUND/USE, negativa.
                const movementType =
                    params.type === 'INBOUND_INVOICE' ? 'IN' :
                        params.type === 'OUTBOUND_SALE' ? 'OUT' :
                            params.type === 'INTERNAL_USE' ? 'OUT' :
                                params.type === 'LOSS' ? 'LOSS' : 'ADJUST';

                const multiplier = (movementType === 'IN' || (movementType === 'ADJUST' && item.quantity > 0)) ? 1 : -1;

                const { error: movementError } = await supabase
                    .from('inventory_movements')
                    .insert([{
                        batch_id: targetBatchId,
                        type: movementType,
                        quantity: Math.abs(item.quantity) * multiplier,
                        description: `Transação #${transaction.invoice_number || transaction.id.slice(0, 8)}`,
                        created_by: user.id,
                        organization_id: profile?.organization_id
                    }]);

                if (movementError) throw movementError;
            }

            // 3. Integração Financeira (Opcional)
            if (params.createFinancialRecord && transaction) {
                const isExpense = params.type === 'INBOUND_INVOICE';
                const totalValue = params.items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);

                if (totalValue > 0) {
                    await supabase.from('financial_transactions').insert([{
                        user_id: user.id,
                        type: isExpense ? 'saida' : 'entrada', // ou 'despesa'/'receita' dependendo do enum
                        amount: totalValue,
                        description: `${isExpense ? 'Compra de Estoque' : 'Venda de Estoque'} - Nota ${params.invoice_number || ''}`,
                        status: 'pendente', // Deixar pendente para confirmação
                        transaction_date: params.transaction_date.toISOString(),
                        organization_id: profile?.organization_id
                        // category_id: idealmente buscar categoria "Estoque" ou "Custo de Mercadoria"
                    }]);

                    // TODO: Ligar ID financeiro de volta na inventory_transaction se necessário
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

    return {
        createTransaction
    };
}
