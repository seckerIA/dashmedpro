-- Create Suppliers table
CREATE TABLE IF NOT EXISTS public.inventory_suppliers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id),
    name TEXT NOT NULL,
    cnpj TEXT,
    email TEXT,
    phone TEXT,
    contact_person TEXT,
    address TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create Inventory Transactions (Headers for Invoice/Movement)
-- Replaces/Augments the concept of granular movements, serving as the "Invoice Header"
CREATE TABLE IF NOT EXISTS public.inventory_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id), -- Owner/Context
    supplier_id UUID REFERENCES public.inventory_suppliers(id), -- Optional, for INBOUND
    type TEXT NOT NULL CHECK (type IN ('INBOUND_INVOICE', 'OUTBOUND_SALE', 'INTERNAL_USE', 'ADJUSTMENT', 'LOSS')),
    invoice_number TEXT,
    transaction_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    total_amount DECIMAL(15, 2) DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'COMPLETED' CHECK (status IN ('DRAFT', 'COMPLETED', 'CANCELLED')),
    financial_transaction_id UUID REFERENCES public.financial_transactions(id), -- Link to finance
    description TEXT,
    created_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create Inventory Transaction Items (Line Items)
CREATE TABLE IF NOT EXISTS public.inventory_transaction_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id UUID NOT NULL REFERENCES public.inventory_transactions(id) ON DELETE CASCADE,
    item_id UUID NOT NULL REFERENCES public.inventory_items(id),
    batch_id UUID REFERENCES public.inventory_batches(id), -- Created on IN, Used on OUT
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10, 2), -- Cost price (IN) or Sell price (OUT)
    total_price DECIMAL(15, 2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add RLS Policies

-- Suppliers
ALTER TABLE public.inventory_suppliers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own suppliers" ON public.inventory_suppliers
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Secretaries can view linked doctor suppliers" ON public.inventory_suppliers
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.secretary_doctor_links
            WHERE secretary_id = auth.uid() AND doctor_id = inventory_suppliers.user_id
        )
    );

-- Transactions
ALTER TABLE public.inventory_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own transactions" ON public.inventory_transactions
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Secretaries can view linked doctor transactions" ON public.inventory_transactions
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.secretary_doctor_links
            WHERE secretary_id = auth.uid() AND doctor_id = inventory_transactions.user_id
        )
    );
    
-- Transaction Items
ALTER TABLE public.inventory_transaction_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own transaction items" ON public.inventory_transaction_items
    USING (
        EXISTS (
            SELECT 1 FROM public.inventory_transactions
            WHERE id = inventory_transaction_items.transaction_id AND user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.inventory_transactions
            WHERE id = inventory_transaction_items.transaction_id AND user_id = auth.uid()
        )
    );

CREATE POLICY "Secretaries can view linked doctor transaction items" ON public.inventory_transaction_items
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.inventory_transactions t
            JOIN public.secretary_doctor_links l ON l.doctor_id = t.user_id
            WHERE t.id = inventory_transaction_items.transaction_id AND l.secretary_id = auth.uid()
        )
    );
