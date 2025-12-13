-- ============================================
-- Migration: Update CRM RLS Policies
-- Description: Ajusta policies para:
--   - Contatos: individuais por usuário (já ok)
--   - Deals: globais (todos veem)
--   - Atividades: globais (todos veem)  
--   - Tarefas: globais (todos veem)
-- ============================================

-- ============================================
-- CRM DEALS - Tornar global
-- ============================================

-- Remover policies antigas de deals
DROP POLICY IF EXISTS "Users can view their own deals" ON crm_deals;
DROP POLICY IF EXISTS "Users can delete their own deals" ON crm_deals;

-- Criar novas policies globais para deals
-- Todos podem ver todos os deals
CREATE POLICY "Users can view all deals"
  ON crm_deals
  FOR SELECT
  USING (true);

-- Todos podem criar deals
CREATE POLICY "Users can insert deals"
  ON crm_deals
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Todos podem atualizar deals (mantém a lógica de owner ou assigned)
-- A policy "Users can update their own deals or assigned deals" já existe

-- Todos podem deletar seus próprios deals
CREATE POLICY "Users can delete their deals"
  ON crm_deals
  FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- CRM ACTIVITIES - Tornar global
-- ============================================

-- Remover policy antiga de visualização
DROP POLICY IF EXISTS "Users can view their own activities" ON crm_activities;

-- Criar nova policy global
CREATE POLICY "Users can view all activities"
  ON crm_activities
  FOR SELECT
  USING (true);

-- Manter as outras policies (insert, update, delete) para o dono apenas
-- As policies existentes já estão ok para isso

-- ============================================
-- TASKS - Tornar global (todos veem todas)
-- ============================================

-- Remover policies antigas de visualização individual
DROP POLICY IF EXISTS "Users can view their own tasks" ON tasks;
DROP POLICY IF EXISTS "Users can view their own tasks or assigned tasks" ON tasks;

-- Criar nova policy global para visualização
-- Note: A policy "Admin and Dono can view all tasks" já existe
-- Vamos adicionar uma para TODOS verem TODAS as tarefas
CREATE POLICY "Users can view all tasks"
  ON tasks
  FOR SELECT
  USING (true);

-- As outras policies de insert/update/delete permanecem restritas ao dono/criador

-- ============================================
-- Comentários explicativos
-- ============================================

COMMENT ON POLICY "Users can view all deals" ON crm_deals IS 
'Permite que todos os usuários visualizem todos os deals (pipeline global)';

COMMENT ON POLICY "Users can view all activities" ON crm_activities IS 
'Permite que todos os usuários visualizem todas as atividades do CRM';

COMMENT ON POLICY "Users can view all tasks" ON tasks IS 
'Permite que todos os usuários visualizem todas as tarefas da empresa';
