-- =====================================================
-- INTEGRAÇÃO CRM + TAREFAS - EXECUTAR NO SUPABASE
-- =====================================================
-- Execute este SQL completo no Dashboard do Supabase
-- para adicionar os campos de relacionamento CRM nas tarefas

-- 1. Verificar se as tabelas CRM existem
SELECT 
  table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('crm_deals', 'crm_contacts', 'tasks');

-- 2. Adicionar colunas para relacionamento com CRM na tabela tasks
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS deal_id UUID REFERENCES public.crm_deals(id) ON DELETE SET NULL;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS contact_id UUID REFERENCES public.crm_contacts(id) ON DELETE SET NULL;

-- 3. Adicionar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_tasks_deal_id ON public.tasks(deal_id);
CREATE INDEX IF NOT EXISTS idx_tasks_contact_id ON public.tasks(contact_id);

-- 4. Adicionar comentários para documentação
COMMENT ON COLUMN public.tasks.deal_id IS 'ID do deal relacionado (opcional)';
COMMENT ON COLUMN public.tasks.contact_id IS 'ID do contato relacionado (opcional)';

-- 5. Verificar se as colunas foram adicionadas corretamente
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'tasks' 
  AND column_name IN ('deal_id', 'contact_id')
ORDER BY column_name;

-- 6. Verificar se existem tarefas na tabela
SELECT COUNT(*) as total_tasks FROM public.tasks;

-- 7. Verificar estrutura atual da tabela tasks
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'tasks'
ORDER BY ordinal_position;

-- As policies RLS existentes já cobrem os novos campos através do user_id
-- Não é necessário criar novas policies