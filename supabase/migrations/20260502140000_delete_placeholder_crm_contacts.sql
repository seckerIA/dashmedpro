-- Remove contatos de teste/sandbox (ex.: placeholders do Meta) que poluem a busca de pacientes.
-- Deals e dados ligados com ON DELETE CASCADE / SET NULL são tratados pelas FKs existentes.

DELETE FROM public.crm_contacts
WHERE (
  full_name ILIKE '%<test lead%'
  OR full_name ILIKE '%dummy data for%'
  OR COALESCE(phone, '') ILIKE '%<test lead%'
  OR COALESCE(phone, '') ILIKE '%dummy data for%'
  OR COALESCE(email, '') ILIKE '%dummy data for%'
);
