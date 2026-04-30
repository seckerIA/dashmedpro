-- Migration: WhatsApp AI Follow-up Automático
-- Adiciona colunas para suporte ao cron de re-engajamento de conversas frias

-- ============================================================
-- 1. Colunas em whatsapp_conversations
-- ============================================================
ALTER TABLE public.whatsapp_conversations
  ADD COLUMN IF NOT EXISTS followup_attempts int NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_followup_at timestamptz NULL,
  ADD COLUMN IF NOT EXISTS followup_disabled boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_wa_conv_followup_lookup
  ON public.whatsapp_conversations (last_message_at, last_message_direction)
  WHERE followup_disabled = false AND status NOT IN ('resolved','spam');

-- ============================================================
-- 2. Colunas em whatsapp_ai_config (opt-in por usuario)
-- ============================================================
ALTER TABLE public.whatsapp_ai_config
  ADD COLUMN IF NOT EXISTS followup_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS followup_window_start_hour int NOT NULL DEFAULT 8 CHECK (followup_window_start_hour BETWEEN 0 AND 23),
  ADD COLUMN IF NOT EXISTS followup_window_end_hour int NOT NULL DEFAULT 21 CHECK (followup_window_end_hour BETWEEN 0 AND 23),
  ADD COLUMN IF NOT EXISTS followup_max_attempts int NOT NULL DEFAULT 3 CHECK (followup_max_attempts BETWEEN 1 AND 5);

-- ============================================================
-- 3. Habilitar pg_cron + pg_net (extensoes necessarias)
-- ============================================================
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;
