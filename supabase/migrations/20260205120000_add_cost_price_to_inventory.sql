-- Add cost_price to inventory_items
ALTER TABLE public.inventory_items 
ADD COLUMN IF NOT EXISTS cost_price DECIMAL(10, 2);

-- Update RLS if necessary (it's not because existing policies cover the whole row)
