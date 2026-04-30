-- Delay humanizado antes da IA enviar a primeira resposta (segundos)
ALTER TABLE whatsapp_ai_config
  ADD COLUMN IF NOT EXISTS ai_reply_delay_min_seconds INTEGER NOT NULL DEFAULT 120,
  ADD COLUMN IF NOT EXISTS ai_reply_delay_max_seconds INTEGER NOT NULL DEFAULT 300;

COMMENT ON COLUMN whatsapp_ai_config.ai_reply_delay_min_seconds IS
  'Espera minima (segundos) antes de responder ao lead; padrao 120 (2 min)';
COMMENT ON COLUMN whatsapp_ai_config.ai_reply_delay_max_seconds IS
  'Espera maxima (segundos) antes de responder ao lead; padrao 300 (5 min)';
