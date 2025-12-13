-- Drop the existing view that may have SECURITY DEFINER
DROP VIEW IF EXISTS public.vw_transactions_with_net_profit CASCADE;

-- Recreate the view WITHOUT SECURITY DEFINER (SECURITY INVOKER is the default and safer)
-- This ensures the view runs with the permissions of the querying user, not the creator
CREATE VIEW public.vw_transactions_with_net_profit 
WITH (security_invoker = true)
AS
SELECT 
  t.id,
  t.user_id,
  t.type,
  t.description,
  t.amount AS gross_amount,
  t.total_costs,
  (t.amount - COALESCE(t.total_costs, 0)) AS net_amount,
  CASE
    WHEN t.amount > 0 THEN (((t.amount - COALESCE(t.total_costs, 0)) / t.amount) * 100)
    ELSE 0
  END AS profit_margin_percentage,
  t.transaction_date,
  t.category_id,
  t.account_id,
  t.has_costs,
  t.created_at,
  t.updated_at
FROM public.financial_transactions t
WHERE t.type = 'entrada';

-- Enable RLS on the view (views inherit RLS from base tables by default with security_invoker)
-- This comment confirms that RLS from financial_transactions table will be enforced
COMMENT ON VIEW public.vw_transactions_with_net_profit IS 
'View of transactions with net profit calculations. Uses SECURITY INVOKER to ensure RLS policies from financial_transactions table are properly enforced for each querying user.';