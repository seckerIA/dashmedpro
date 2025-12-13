-- ============================================
-- Migration: Cleanup Duplicate Policies
-- Description: Remove policies duplicadas e antigas de crm_deals
-- Date: 2025-01-10
-- ============================================

-- Remover policy antiga com lógica de toggle (não usamos mais)
DROP POLICY IF EXISTS "Users can update their deals or all if admin/dono with toggle" ON crm_deals;
DROP POLICY IF EXISTS "Users can view their deals or all if admin/dono with toggle" ON crm_deals;

-- Remover policy duplicada de INSERT
DROP POLICY IF EXISTS "Users can insert their own deals" ON crm_deals;

-- Remover policy duplicada de DELETE (se existir)
DROP POLICY IF EXISTS "Users can delete their own deals" ON crm_deals;

-- Adicionar comentários nas policies finais
COMMENT ON POLICY "Users can insert deals" ON crm_deals IS 
'Permite que usuários criem novos deals. O user_id é automaticamente definido como o criador.';

COMMENT ON POLICY "Users can delete their deals" ON crm_deals IS 
'Permite que usuários deletem apenas seus próprios deals (não pode deletar deals de outros, mesmo Admin/Dono).';

COMMENT ON POLICY "Users can view all deals" ON crm_deals IS 
'Permite que todos os usuários visualizem todos os deals (pipeline global).';

