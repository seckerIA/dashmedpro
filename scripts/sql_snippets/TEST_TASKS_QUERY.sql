-- =====================================================
-- TESTE DE QUERY DE TAREFAS - EXECUTAR APÓS A MIGRAÇÃO
-- =====================================================
-- Execute este SQL para testar se as tarefas estão sendo buscadas corretamente

-- 1. Verificar tarefas existentes
SELECT 
  id,
  title,
  description,
  user_id,
  created_by,
  assigned_to,
  status,
  priority,
  category,
  deal_id,
  contact_id,
  created_at
FROM public.tasks 
ORDER BY created_at DESC
LIMIT 10;

-- 2. Testar query com relacionamentos (similar ao que o frontend usa)
SELECT 
  t.*,
  assigned_to_profile.id as assigned_to_profile_id,
  assigned_to_profile.full_name as assigned_to_profile_name,
  assigned_to_profile.email as assigned_to_profile_email,
  created_by_profile.id as created_by_profile_id,
  created_by_profile.full_name as created_by_profile_name,
  created_by_profile.email as created_by_profile_email,
  deal.id as deal_id,
  deal.title as deal_title,
  deal.value as deal_value,
  deal.stage as deal_stage,
  contact.id as contact_id,
  contact.full_name as contact_name,
  contact.email as contact_email,
  contact.company as contact_company
FROM public.tasks t
LEFT JOIN public.profiles assigned_to_profile ON t.assigned_to = assigned_to_profile.id
LEFT JOIN public.profiles created_by_profile ON t.created_by = created_by_profile.id
LEFT JOIN public.crm_deals deal ON t.deal_id = deal.id
LEFT JOIN public.crm_contacts contact ON t.contact_id = contact.id
ORDER BY t.position ASC, t.created_at DESC
LIMIT 10;

-- 3. Verificar se existem deals e contatos para testar relacionamentos
SELECT COUNT(*) as total_deals FROM public.crm_deals;
SELECT COUNT(*) as total_contacts FROM public.crm_contacts;

-- 4. Verificar perfis de usuários
SELECT 
  id,
  email,
  full_name,
  role,
  is_active
FROM public.profiles
WHERE is_active = true
ORDER BY created_at DESC;
