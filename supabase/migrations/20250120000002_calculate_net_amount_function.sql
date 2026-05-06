-- Lucro líquido por transação (não estava na complete_database_schema; era só em 20250107000000, que agora corre cedo demais).
CREATE OR REPLACE FUNCTION public.calculate_net_amount(p_transaction_id UUID)
RETURNS DECIMAL(15,2)
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_amount DECIMAL(15,2);
  v_total_costs DECIMAL(15,2);
BEGIN
  SELECT amount, total_costs
  INTO v_amount, v_total_costs
  FROM public.financial_transactions
  WHERE id = p_transaction_id;

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  RETURN v_amount - COALESCE(v_total_costs, 0);
END;
$$;

COMMENT ON FUNCTION public.calculate_net_amount(UUID) IS 'amount bruto menos total_costs da transação';
