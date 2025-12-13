-- Integração CRM + Tarefas
-- Adicionar campos de relacionamento na tabela tasks

-- Adicionar colunas para relacionamento com CRM
ALTER TABLE public.tasks ADD COLUMN deal_id UUID REFERENCES public.crm_deals(id) ON DELETE SET NULL;
ALTER TABLE public.tasks ADD COLUMN contact_id UUID REFERENCES public.crm_contacts(id) ON DELETE SET NULL;

-- Adicionar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_tasks_deal_id ON public.tasks(deal_id);
CREATE INDEX IF NOT EXISTS idx_tasks_contact_id ON public.tasks(contact_id);

-- Adicionar comentários para documentação
COMMENT ON COLUMN public.tasks.deal_id IS 'ID do deal relacionado (opcional)';
COMMENT ON COLUMN public.tasks.contact_id IS 'ID do contato relacionado (opcional)';

-- Atualizar RLS policies para incluir os novos campos
-- As policies existentes já cobrem os novos campos através do user_id
