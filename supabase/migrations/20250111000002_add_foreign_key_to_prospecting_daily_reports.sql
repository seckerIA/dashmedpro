-- Adicionar foreign key constraint para relacionar prospecting_daily_reports com profiles
-- Esta migration foi aplicada via MCP do Supabase

ALTER TABLE prospecting_daily_reports 
ADD CONSTRAINT fk_prospecting_daily_reports_user 
FOREIGN KEY (user_id) 
REFERENCES profiles(id) 
ON DELETE CASCADE;

