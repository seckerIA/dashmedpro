-- Store video links the AI should send before discussing consultation investment
ALTER TABLE whatsapp_ai_config
ADD COLUMN IF NOT EXISTS pre_investment_videos TEXT;

COMMENT ON COLUMN whatsapp_ai_config.pre_investment_videos IS
  'Links de videos (um por linha) para enviar antes de falar de investimento com o lead';
