-- Add task_id to notifications for task-related notifications
ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS task_id UUID REFERENCES public.tasks(id);

-- Create foreign key from sales_calls to crm_deals (not just deals)
ALTER TABLE public.sales_calls 
  DROP CONSTRAINT IF EXISTS sales_calls_deal_id_fkey;
  
-- Rename deal_id column temporarily and add the correct one
ALTER TABLE public.sales_calls 
  ADD COLUMN IF NOT EXISTS crm_deal_id UUID REFERENCES public.crm_deals(id) ON DELETE SET NULL;

-- Copy data if exists
UPDATE public.sales_calls SET crm_deal_id = deal_id WHERE crm_deal_id IS NULL AND deal_id IS NOT NULL;