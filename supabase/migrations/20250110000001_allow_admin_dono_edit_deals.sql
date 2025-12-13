-- ============================================
-- Migration: Allow Admin/Dono to Edit All Deals
-- Description: Atualiza policy de UPDATE em crm_deals para permitir
--              que Admin e Dono editem deals de qualquer usuário,
--              mantendo o owner original inalterado.
-- Date: 2025-01-10
-- ============================================

-- Remover policy antiga de UPDATE
DROP POLICY IF EXISTS "Users can update their own deals or assigned deals" ON crm_deals;

-- Criar nova policy que permite:
-- 1. Owner editar seus próprios deals
-- 2. Assigned_to editar deals atribuídos a eles
-- 3. Admin/Dono editar qualquer deal
CREATE POLICY "Users can update deals"
  ON crm_deals
  FOR UPDATE
  USING (
    auth.uid() = user_id 
    OR auth.uid() = assigned_to
    OR is_admin_or_dono(auth.uid())
  );

-- Adicionar comentário explicativo
COMMENT ON POLICY "Users can update deals" ON crm_deals IS 
'Permite que usuários editem seus próprios deals, deals atribuídos a eles, ou se forem Admin/Dono, qualquer deal. O owner original permanece inalterado.';

