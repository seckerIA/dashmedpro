-- ===========================================
-- Migration: WhatsApp AI Agent (Sophia-style)
-- Creates tables, columns, and RPCs for the
-- new humanized AI agent
-- ===========================================

-- 1. Enable pgvector if not already
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Knowledge Base table (RAG with embeddings)
CREATE TABLE IF NOT EXISTS public.sofia_knowledge_base (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',
  embedding vector(1536),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sofia_kb_user ON sofia_knowledge_base(user_id);
CREATE INDEX IF NOT EXISTS idx_sofia_kb_active ON sofia_knowledge_base(user_id, is_active);
ALTER TABLE sofia_knowledge_base ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'sofia_knowledge_base' AND policyname = 'Users manage own KB') THEN
    CREATE POLICY "Users manage own KB" ON sofia_knowledge_base FOR ALL USING (auth.uid() = user_id);
  END IF;
END $$;

GRANT ALL ON sofia_knowledge_base TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON sofia_knowledge_base TO authenticated;

-- 3. Lead Qualifications table (structured lead data)
CREATE TABLE IF NOT EXISTS public.whatsapp_lead_qualifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID UNIQUE NOT NULL REFERENCES whatsapp_conversations(id) ON DELETE CASCADE,
  phone_number TEXT,
  nome TEXT,
  procedimento_desejado TEXT,
  convenio TEXT,
  urgencia TEXT DEFAULT 'normal',
  como_conheceu TEXT,
  temperatura_lead TEXT DEFAULT 'frio',
  status TEXT DEFAULT 'em_conversa',
  data_agendamento TEXT,
  doctor_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE whatsapp_lead_qualifications ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'whatsapp_lead_qualifications' AND policyname = 'Service role full access lead quals') THEN
    CREATE POLICY "Service role full access lead quals" ON whatsapp_lead_qualifications FOR ALL USING (true);
  END IF;
END $$;

GRANT ALL ON whatsapp_lead_qualifications TO service_role;

-- 4. Add ai_lock_until to whatsapp_conversations
ALTER TABLE whatsapp_conversations
  ADD COLUMN IF NOT EXISTS ai_lock_until TIMESTAMPTZ DEFAULT NULL;

-- 5. Add new columns to whatsapp_ai_config
ALTER TABLE whatsapp_ai_config
  ADD COLUMN IF NOT EXISTS knowledge_base TEXT,
  ADD COLUMN IF NOT EXISTS already_known_info TEXT,
  ADD COLUMN IF NOT EXISTS custom_prompt_instructions TEXT,
  ADD COLUMN IF NOT EXISTS auto_reply_enabled BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS auto_scheduling_enabled BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS agent_name TEXT DEFAULT 'Sofia',
  ADD COLUMN IF NOT EXISTS agent_greeting TEXT,
  ADD COLUMN IF NOT EXISTS clinic_name TEXT,
  ADD COLUMN IF NOT EXISTS specialist_name TEXT;

-- 6. RPC: Atomic lock for AI agent
CREATE OR REPLACE FUNCTION try_acquire_ai_lock(
  p_conversation_id UUID,
  p_lock_seconds INT DEFAULT 35
) RETURNS BOOLEAN AS $$
DECLARE v_rows INT;
BEGIN
  UPDATE whatsapp_conversations
  SET ai_lock_until = NOW() + (p_lock_seconds || ' seconds')::INTERVAL
  WHERE id = p_conversation_id
    AND (ai_lock_until IS NULL OR ai_lock_until < NOW());
  GET DIAGNOSTICS v_rows = ROW_COUNT;
  RETURN v_rows > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. RPC: Release lock
CREATE OR REPLACE FUNCTION release_ai_lock(p_conversation_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE whatsapp_conversations SET ai_lock_until = NULL WHERE id = p_conversation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. RPC: RAG similarity search
CREATE OR REPLACE FUNCTION match_knowledge(
  p_user_id UUID,
  p_query_embedding vector(1536),
  p_match_threshold FLOAT DEFAULT 0.5,
  p_match_count INT DEFAULT 5
)
RETURNS TABLE (id UUID, title TEXT, content TEXT, category TEXT, similarity FLOAT)
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  SELECT
    kb.id, kb.title, kb.content, kb.category,
    (1 - (kb.embedding <=> p_query_embedding))::FLOAT AS similarity
  FROM sofia_knowledge_base kb
  WHERE kb.user_id = p_user_id
    AND kb.is_active = true
    AND kb.embedding IS NOT NULL
    AND (1 - (kb.embedding <=> p_query_embedding)) > p_match_threshold
  ORDER BY kb.embedding <=> p_query_embedding
  LIMIT p_match_count;
END;
$$;
