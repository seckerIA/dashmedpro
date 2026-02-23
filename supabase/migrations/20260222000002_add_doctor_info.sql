-- Add doctor_info column to whatsapp_ai_config
-- Stores doctor bio, specialty, and approach information
-- Incorporated into the AI agent's system prompt

ALTER TABLE whatsapp_ai_config
ADD COLUMN IF NOT EXISTS doctor_info TEXT;

COMMENT ON COLUMN whatsapp_ai_config.doctor_info IS
  'Informacoes sobre o medico (bio, especialidade, abordagem) incorporadas no prompt da IA';
