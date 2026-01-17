
export type InventoryItemCategory = 'Vacina' | 'Medicamento' | 'Material' | 'Geral';

export interface InventoryItem {
    id: string;
    user_id: string;
    name: string;
    unit: string;
    category: InventoryItemCategory | string;
    min_stock: number;
    sell_price: number | null;
    description: string | null;
    created_at: string;
    updated_at: string;
    // Join fields (opcionais)
    batches?: InventoryBatch[];
    total_quantity?: number; // Calculado no frontend ou via view
}

export type InventoryItemInsert = Omit<InventoryItem, 'id' | 'created_at' | 'updated_at' | 'batches' | 'total_quantity'>;
export type InventoryItemUpdate = Partial<InventoryItemInsert>;

export interface InventoryBatch {
    id: string;
    item_id: string;
    batch_number: string;
    expiration_date: string | null; // YYYY-MM-DD
    quantity: number;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export type InventoryBatchInsert = Omit<InventoryBatch, 'id' | 'created_at' | 'updated_at'>;
export type InventoryBatchUpdate = Partial<InventoryBatchInsert>;

export type MovementType = 'IN' | 'OUT' | 'ADJUST' | 'LOSS';

export interface InventoryMovement {
    id: string;
    batch_id: string;
    type: MovementType;
    quantity: number;
    previous_balance: number | null;
    new_balance: number | null;
    reference_id: string | null;
    description: string | null;
    created_by: string | null;
    created_at: string;
    // Join fields
    batch?: InventoryBatch;
    item_name?: string;
    created_by_name?: string;
}

export interface ProductConsumption {
    itemId: string;
    batchId: string;
    quantity: number;
    price: number | null;
}
