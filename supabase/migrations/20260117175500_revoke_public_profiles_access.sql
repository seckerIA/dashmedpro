-- Remove a policy insegura que permite acesso público a todos os perfis
-- Esta policy foi identificada como um risco de segurança (exposição de emails/dados pessoais)
-- O frontend (Login, useDoctors) já verifica autenticação antes de acessar profiles.

DROP POLICY IF EXISTS "Users can view all profiles" ON profiles;
