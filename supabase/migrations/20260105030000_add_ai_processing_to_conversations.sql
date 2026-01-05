-- Migration: Add AI processing fields to whatsapp_conversations
-- Purpose: Track when AI is processing a response to show "typing" indicator

ALTER TABLE whatsapp_conversations 
ADD COLUMN IF NOT EXISTS ai_processing BOOLEAN DEFAULT false;

ALTER TABLE whatsapp_conversations 
ADD COLUMN IF NOT EXISTS ai_processing_started_at TIMESTAMPTZ;

-- Index for quick lookup of processing conversations
CREATE INDEX IF NOT EXISTS idx_whatsapp_conversations_ai_processing 
ON whatsapp_conversations(ai_processing) 
WHERE ai_processing = true;

-- Comment
COMMENT ON COLUMN whatsapp_conversations.ai_processing IS 'True when AI is analyzing this conversation';
COMMENT ON COLUMN whatsapp_conversations.ai_processing_started_at IS 'When AI started processing (for timeout detection)';
