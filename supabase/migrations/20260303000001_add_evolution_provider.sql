-- Migration: Add Evolution API as second WhatsApp provider
-- Date: 2026-03-03

-- 1. Create provider enum
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'whatsapp_provider') THEN
    CREATE TYPE whatsapp_provider AS ENUM ('meta', 'evolution');
  END IF;
END$$;

-- 2. Add Evolution columns to whatsapp_config
ALTER TABLE whatsapp_config
  ADD COLUMN IF NOT EXISTS provider whatsapp_provider NOT NULL DEFAULT 'meta',
  ADD COLUMN IF NOT EXISTS evolution_instance_name TEXT,
  ADD COLUMN IF NOT EXISTS evolution_instance_token TEXT,
  ADD COLUMN IF NOT EXISTS evolution_api_url TEXT,
  ADD COLUMN IF NOT EXISTS evolution_instance_status TEXT DEFAULT 'disconnected';

-- 3. Index for Evolution lookups
CREATE INDEX IF NOT EXISTS idx_whatsapp_config_evolution
  ON whatsapp_config(evolution_instance_name)
  WHERE provider = 'evolution';

-- 4. Add provider to conversations for fast routing
ALTER TABLE whatsapp_conversations
  ADD COLUMN IF NOT EXISTS provider whatsapp_provider DEFAULT 'meta';

-- 5. Add provider to messages for audit trail
ALTER TABLE whatsapp_messages
  ADD COLUMN IF NOT EXISTS provider whatsapp_provider DEFAULT 'meta';

-- 6. RLS: Evolution webhook needs service_role access (existing policies cover user_id checks)
-- No new RLS policies needed — existing ones filter by user_id which we set correctly in the webhook
