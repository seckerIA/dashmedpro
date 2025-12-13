-- ============================================
-- MIGRATION: Sistema de Custos para Transações
-- Descrição: Adiciona suporte para custos associados a prestações de serviço
-- Data: 2025-01-07
-- ============================================

-- 1. Criar tabela transaction_costs
CREATE TABLE IF NOT EXISTS transaction_costs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  transaction_id UUID NOT NULL REFERENCES financial_transactions(id) ON DELETE CASCADE,
  cost_type TEXT NOT NULL CHECK (cost_type IN ('ferramentas', 'operacional', 'terceirizacao')),
  amount DECIMAL(15,2) NOT NULL CHECK (amount >= 0),
  description TEXT,
  attachment_id UUID REFERENCES financial_attachments(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Índices para performance
CREATE INDEX IF NOT EXISTS idx_transaction_costs_transaction ON transaction_costs(transaction_id);
CREATE INDEX IF NOT EXISTS idx_transaction_costs_type ON transaction_costs(cost_type);

-- 3. Adicionar campos em financial_transactions
ALTER TABLE financial_transactions
ADD COLUMN IF NOT EXISTS has_costs BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS total_costs DECIMAL(15,2) DEFAULT 0;

-- 4. Função para atualizar custos totais
CREATE OR REPLACE FUNCTION update_transaction_costs()
RETURNS TRIGGER AS $$
DECLARE
  v_transaction_id UUID;
BEGIN
  -- Determinar o transaction_id (INSERT, UPDATE ou DELETE)
  IF TG_OP = 'DELETE' THEN
    v_transaction_id := OLD.transaction_id;
  ELSE
    v_transaction_id := NEW.transaction_id;
  END IF;

  -- Atualizar total_costs e has_costs
  UPDATE financial_transactions
  SET 
    total_costs = COALESCE((
      SELECT SUM(amount)
      FROM transaction_costs
      WHERE transaction_id = v_transaction_id
    ), 0),
    has_costs = EXISTS(
      SELECT 1 FROM transaction_costs WHERE transaction_id = v_transaction_id
    ),
    updated_at = NOW()
  WHERE id = v_transaction_id;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- 5. Trigger para atualizar custos
DROP TRIGGER IF EXISTS trigger_update_transaction_costs ON transaction_costs;
CREATE TRIGGER trigger_update_transaction_costs
AFTER INSERT OR UPDATE OR DELETE ON transaction_costs
FOR EACH ROW EXECUTE FUNCTION update_transaction_costs();

-- 6. Função para calcular lucro líquido
CREATE OR REPLACE FUNCTION calculate_net_amount(
  p_transaction_id UUID
)
RETURNS DECIMAL(15,2) AS $$
DECLARE
  v_amount DECIMAL(15,2);
  v_total_costs DECIMAL(15,2);
BEGIN
  SELECT amount, total_costs
  INTO v_amount, v_total_costs
  FROM financial_transactions
  WHERE id = p_transaction_id;

  RETURN v_amount - COALESCE(v_total_costs, 0);
END;
$$ LANGUAGE plpgsql;

-- 7. Atualizar trigger de updated_at para transaction_costs
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_transaction_costs_updated_at ON transaction_costs;
CREATE TRIGGER update_transaction_costs_updated_at
BEFORE UPDATE ON transaction_costs
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 8. RLS (Row Level Security) para transaction_costs
ALTER TABLE transaction_costs ENABLE ROW LEVEL SECURITY;

-- Policy: Usuários podem ver seus próprios custos
CREATE POLICY "Users can view their own transaction costs"
ON transaction_costs FOR SELECT
USING (
  transaction_id IN (
    SELECT id FROM financial_transactions WHERE user_id = auth.uid()
  )
);

-- Policy: Usuários podem inserir custos em suas transações
CREATE POLICY "Users can insert costs to their transactions"
ON transaction_costs FOR INSERT
WITH CHECK (
  transaction_id IN (
    SELECT id FROM financial_transactions WHERE user_id = auth.uid()
  )
);

-- Policy: Usuários podem atualizar seus custos
CREATE POLICY "Users can update their own transaction costs"
ON transaction_costs FOR UPDATE
USING (
  transaction_id IN (
    SELECT id FROM financial_transactions WHERE user_id = auth.uid()
  )
)
WITH CHECK (
  transaction_id IN (
    SELECT id FROM financial_transactions WHERE user_id = auth.uid()
  )
);

-- Policy: Usuários podem deletar seus custos
CREATE POLICY "Users can delete their own transaction costs"
ON transaction_costs FOR DELETE
USING (
  transaction_id IN (
    SELECT id FROM financial_transactions WHERE user_id = auth.uid()
  )
);

-- 9. Comentários para documentação
COMMENT ON TABLE transaction_costs IS 'Custos associados a transações de prestação de serviços';
COMMENT ON COLUMN transaction_costs.cost_type IS 'Tipo de custo: ferramentas, operacional ou terceirizacao';
COMMENT ON COLUMN transaction_costs.amount IS 'Valor do custo em reais';
COMMENT ON COLUMN transaction_costs.description IS 'Descrição detalhada do custo';
COMMENT ON COLUMN transaction_costs.attachment_id IS 'Referência ao comprovante anexado';

COMMENT ON COLUMN financial_transactions.has_costs IS 'Indica se a transação possui custos associados';
COMMENT ON COLUMN financial_transactions.total_costs IS 'Soma total de todos os custos associados';

-- 10. View para relatórios de lucro líquido
CREATE OR REPLACE VIEW vw_transactions_with_net_profit AS
SELECT 
  t.id,
  t.user_id,
  t.type,
  t.description,
  t.amount as gross_amount,
  t.total_costs,
  (t.amount - COALESCE(t.total_costs, 0)) as net_amount,
  CASE 
    WHEN t.amount > 0 THEN ((t.amount - COALESCE(t.total_costs, 0)) / t.amount * 100)
    ELSE 0
  END as profit_margin_percentage,
  t.transaction_date,
  t.category_id,
  t.account_id,
  t.has_costs,
  t.created_at,
  t.updated_at
FROM financial_transactions t
WHERE t.type = 'entrada';

COMMENT ON VIEW vw_transactions_with_net_profit IS 'View com cálculo de lucro líquido para transações de entrada';

