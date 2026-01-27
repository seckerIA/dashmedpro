-- Adicionar coluna de metadata para armazenar IDs de origem e evitar duplicação
ALTER TABLE notifications 
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Criar índice para busca performática em chaves do metadata (ex: appointment_id)
CREATE INDEX IF NOT EXISTS idx_notifications_metadata ON notifications USING gin (metadata);
