-- Create Inventory Tables

-- 1. Inventory Items (Produtos)
CREATE TABLE IF NOT EXISTS public.inventory_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id),
    name TEXT NOT NULL,
    unit TEXT NOT NULL DEFAULT 'unidade',
    category TEXT DEFAULT 'Geral',
    min_stock INTEGER DEFAULT 5,
    sell_price DECIMAL(10, 2), -- Preço de venda para cobrança automática
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Inventory Batches (Lotes)
CREATE TABLE IF NOT EXISTS public.inventory_batches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_id UUID NOT NULL REFERENCES public.inventory_items(id) ON DELETE CASCADE,
    batch_number TEXT NOT NULL,
    expiration_date DATE,
    quantity INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Inventory Movements (Histórico)
CREATE TABLE IF NOT EXISTS public.inventory_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    batch_id UUID NOT NULL REFERENCES public.inventory_batches(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('IN', 'OUT', 'ADJUST', 'LOSS')),
    quantity INTEGER NOT NULL, -- Pode ser negativo para OUT/LOSS, ou positivo para IN
    previous_balance INTEGER, -- Snapshot do saldo antes
    new_balance INTEGER,      -- Snapshot do saldo depois
    reference_id UUID,        -- Link opcional (ex: prontuário id)
    description TEXT,
    created_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_inventory_items_user ON public.inventory_items(user_id);
CREATE INDEX IF NOT EXISTS idx_inventory_batches_item ON public.inventory_batches(item_id);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_batch ON public.inventory_movements(batch_id);

-- RLS Policies

-- Enable RLS
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_movements ENABLE ROW LEVEL SECURITY;

-- Helper policies

-- ITEMS
CREATE POLICY "Users can manage own inventory items" ON public.inventory_items
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Secretaries can view linked doctor items" ON public.inventory_items
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.secretary_doctor_links
            WHERE secretary_id = auth.uid() AND doctor_id = inventory_items.user_id
        )
    );

CREATE POLICY "Secretaries can update linked doctor items" ON public.inventory_items
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.secretary_doctor_links
            WHERE secretary_id = auth.uid() AND doctor_id = inventory_items.user_id
        )
    );

-- BATCHES (Inherit access via item_id is hard in RLS without joins, so duplicate logic)
CREATE POLICY "Users can manage own batches" ON public.inventory_batches
    USING (
        EXISTS (
            SELECT 1 FROM public.inventory_items
            WHERE id = inventory_batches.item_id AND user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.inventory_items
            WHERE id = inventory_batches.item_id AND user_id = auth.uid()
        )
    );

CREATE POLICY "Secretaries can view linked doctor batches" ON public.inventory_batches
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.inventory_items i
            JOIN public.secretary_doctor_links sdl ON sdl.doctor_id = i.user_id
            WHERE i.id = inventory_batches.item_id AND sdl.secretary_id = auth.uid()
        )
    );
    
CREATE POLICY "Secretaries can manage linked doctor batches" ON public.inventory_batches
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.inventory_items i
            JOIN public.secretary_doctor_links sdl ON sdl.doctor_id = i.user_id
            WHERE i.id = inventory_batches.item_id AND sdl.secretary_id = auth.uid()
        )
    );

-- MOVEMENTS
CREATE POLICY "Users can view own movements" ON public.inventory_movements
    USING (
        EXISTS (
            SELECT 1 FROM public.inventory_batches b
            JOIN public.inventory_items i ON i.id = b.item_id
            WHERE b.id = inventory_movements.batch_id AND i.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert movements" ON public.inventory_movements
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.inventory_batches b
            JOIN public.inventory_items i ON i.id = b.item_id
            WHERE b.id = inventory_movements.batch_id AND i.user_id = auth.uid()
        )
    );
    
CREATE POLICY "Secretaries can view linked doctor movements" ON public.inventory_movements
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.inventory_batches b
            JOIN public.inventory_items i ON i.id = b.item_id
            JOIN public.secretary_doctor_links sdl ON sdl.doctor_id = i.user_id
            WHERE b.id = inventory_movements.batch_id AND sdl.secretary_id = auth.uid()
        )
    );

CREATE POLICY "Secretaries can insert linked doctor movements" ON public.inventory_movements
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.inventory_batches b
            JOIN public.inventory_items i ON i.id = b.item_id
            JOIN public.secretary_doctor_links sdl ON sdl.doctor_id = i.user_id
            WHERE b.id = inventory_movements.batch_id AND sdl.secretary_id = auth.uid()
        )
    );
    
-- Function to update batch quantity on movement (Trigger)
CREATE OR REPLACE FUNCTION public.handle_inventory_movement()
RETURNS TRIGGER AS $$
BEGIN
    -- Update batch quantity
    UPDATE public.inventory_batches
    SET 
        quantity = quantity + NEW.quantity,
        updated_at = NOW()
    WHERE id = NEW.batch_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_inventory_movement
    AFTER INSERT ON public.inventory_movements
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_inventory_movement();
