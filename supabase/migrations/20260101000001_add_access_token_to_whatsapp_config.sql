-- Adiciona coluna access_token à tabela whatsapp_config
-- Como o Vault não possui função read_secret, vamos armazenar o token diretamente

ALTER TABLE public.whatsapp_config
ADD COLUMN IF NOT EXISTS access_token TEXT;

COMMENT ON COLUMN public.whatsapp_config.access_token IS 'Meta WhatsApp Business API Access Token';
