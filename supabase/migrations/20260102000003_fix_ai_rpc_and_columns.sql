-- =====================================================
-- Migration: Fix AI Lead Analysis Types and Functions
-- Description: Cria os tipos ENUM necessários e as funções RPC de IA
-- =====================================================

-- 1. Criar Tipos ENUM se não existirem
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'whatsapp_lead_status') THEN
    CREATE TYPE whatsapp_lead_status AS ENUM (
      'novo', 'frio', 'morno', 'quente', 'convertido', 'perdido'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'whatsapp_urgency_level') THEN
    CREATE TYPE whatsapp_urgency_level AS ENUM (
      'baixa', 'media', 'alta', 'urgente'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'whatsapp_sentiment') THEN
    CREATE TYPE whatsapp_sentiment AS ENUM (
      'positivo', 'neutro', 'negativo'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'whatsapp_suggestion_type') THEN
    CREATE TYPE whatsapp_suggestion_type AS ENUM (
      'quick_reply', 'full_message', 'procedure_info', 'scheduling', 'follow_up'
    );
  END IF;
END$$;

-- 2. Função get_hot_leads (suporta secretárias)
CREATE OR REPLACE FUNCTION public.get_hot_leads(p_user_id UUID, p_limit INTEGER DEFAULT 10)
RETURNS TABLE (
  conversation_id UUID,
  contact_name TEXT,
  phone_number TEXT,
  lead_status whatsapp_lead_status,
  conversion_probability INTEGER,
  detected_intent TEXT,
  detected_procedure TEXT,
  last_message_at TIMESTAMPTZ,
  last_analyzed_at TIMESTAMPTZ
) AS $$
DECLARE
  v_role TEXT;
BEGIN
  SELECT role INTO v_role FROM public.profiles WHERE id = p_user_id;

  RETURN QUERY
  SELECT
    c.id AS conversation_id,
    c.contact_name,
    c.phone_number,
    a.lead_status,
    a.conversion_probability,
    a.detected_intent,
    a.detected_procedure,
    c.last_message_at,
    a.last_analyzed_at
  FROM public.whatsapp_conversations c
  INNER JOIN public.whatsapp_conversation_analysis a ON a.conversation_id = c.id
  WHERE 
    (
      c.user_id = p_user_id
      OR 
      (v_role = 'secretaria' AND EXISTS (
        SELECT 1 FROM public.secretary_doctor_links sdl
        WHERE sdl.secretary_id = p_user_id AND sdl.doctor_id = c.user_id AND sdl.is_active = TRUE
      ))
      OR
      (v_role IN ('admin', 'dono'))
    )
    AND a.lead_status = 'quente'
    AND c.status != 'spam'
  ORDER BY a.conversion_probability DESC, c.last_message_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Função get_pending_followups (suporta secretárias)
CREATE OR REPLACE FUNCTION public.get_pending_followups(p_user_id UUID, p_hours INTEGER DEFAULT 24)
RETURNS TABLE (
  conversation_id UUID,
  contact_name TEXT,
  phone_number TEXT,
  lead_status whatsapp_lead_status,
  hours_since_last_message NUMERIC,
  last_message_preview TEXT
) AS $$
DECLARE
  v_role TEXT;
BEGIN
  SELECT role INTO v_role FROM public.profiles WHERE id = p_user_id;

  RETURN QUERY
  SELECT
    c.id AS conversation_id,
    c.contact_name,
    c.phone_number,
    COALESCE(a.lead_status, 'novo'::whatsapp_lead_status) AS lead_status,
    EXTRACT(EPOCH FROM (NOW() - c.last_message_at)) / 3600 AS hours_since_last_message,
    c.last_message_preview
  FROM public.whatsapp_conversations c
  LEFT JOIN public.whatsapp_conversation_analysis a ON a.conversation_id = c.id
  WHERE 
    (
      c.user_id = p_user_id
      OR 
      (v_role = 'secretaria' AND EXISTS (
        SELECT 1 FROM public.secretary_doctor_links sdl
        WHERE sdl.secretary_id = p_user_id AND sdl.doctor_id = c.user_id AND sdl.is_active = TRUE
      ))
      OR
      (v_role IN ('admin', 'dono'))
    )
    AND c.status IN ('open', 'pending')
    AND c.last_message_at < NOW() - (p_hours || ' hours')::INTERVAL
    AND COALESCE(a.lead_status, 'novo') NOT IN ('convertido', 'perdido')
  ORDER BY c.last_message_at ASC
  LIMIT 10;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Função get_ai_stats (suporta secretárias)
CREATE OR REPLACE FUNCTION public.get_ai_stats(p_user_id UUID)
RETURNS TABLE (
  total_analyzed INTEGER,
  hot_leads INTEGER,
  warm_leads INTEGER,
  cold_leads INTEGER,
  converted INTEGER,
  lost INTEGER,
  avg_conversion_probability NUMERIC,
  suggestions_used INTEGER,
  suggestions_total INTEGER
) AS $$
DECLARE
  v_role TEXT;
  v_target_ids UUID[];
BEGIN
  SELECT role INTO v_role FROM public.profiles WHERE id = p_user_id;

  IF v_role = 'secretaria' THEN
    SELECT ARRAY_AGG(doctor_id) || p_user_id INTO v_target_ids 
    FROM public.secretary_doctor_links 
    WHERE secretary_id = p_user_id AND is_active = TRUE;
  ELSE
    v_target_ids := ARRAY[p_user_id];
  END IF;

  RETURN QUERY
  SELECT
    COUNT(*)::INTEGER AS total_analyzed,
    COUNT(*) FILTER (WHERE lead_status = 'quente')::INTEGER AS hot_leads,
    COUNT(*) FILTER (WHERE lead_status = 'morno')::INTEGER AS warm_leads,
    COUNT(*) FILTER (WHERE lead_status = 'frio')::INTEGER AS cold_leads,
    COUNT(*) FILTER (WHERE lead_status = 'convertido')::INTEGER AS converted,
    COUNT(*) FILTER (WHERE lead_status = 'perdido')::INTEGER AS lost,
    COALESCE(ROUND(AVG(conversion_probability), 1), 0) AS avg_conversion_probability,
    (SELECT COUNT(*) FROM public.whatsapp_ai_suggestions WHERE user_id = ANY(v_target_ids) AND was_used = TRUE)::INTEGER,
    (SELECT COUNT(*) FROM public.whatsapp_ai_suggestions WHERE user_id = ANY(v_target_ids))::INTEGER
  FROM public.whatsapp_conversation_analysis
  WHERE user_id = ANY(v_target_ids);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
