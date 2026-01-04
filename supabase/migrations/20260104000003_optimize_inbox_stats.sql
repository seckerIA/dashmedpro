-- Otimização da função get_whatsapp_inbox_stats
-- Usa os novos índices de phone_number_id para evitar timeouts

CREATE OR REPLACE FUNCTION get_whatsapp_inbox_stats(p_user_id UUID)
RETURNS TABLE (
  total_conversations BIGINT,
  open_count BIGINT,
  pending_count BIGINT,
  resolved_count BIGINT,
  unread_messages BIGINT,
  assigned_to_me BIGINT
) AS $$
DECLARE
  v_phone_number_ids TEXT[];
BEGIN
  -- 1. Buscar quais phone_number_ids o usuário tem acesso
  -- (suas configs + configs dos médicos vinculados)
  SELECT ARRAY_AGG(DISTINCT phone_number_id)
  INTO v_phone_number_ids
  FROM whatsapp_config wc
  WHERE wc.phone_number_id IS NOT NULL 
    AND wc.is_active = true 
    AND (
      wc.user_id = p_user_id
      OR EXISTS (
        SELECT 1 FROM secretary_doctor_links sdl
        WHERE sdl.secretary_id = p_user_id 
          AND sdl.doctor_id = wc.user_id
          AND sdl.is_active = true
      )
    );

  RETURN QUERY
  SELECT
    COUNT(*)::BIGINT as total_conversations,
    COUNT(*) FILTER (WHERE status = 'open')::BIGINT as open_count,
    COUNT(*) FILTER (WHERE status = 'pending')::BIGINT as pending_count,
    COUNT(*) FILTER (WHERE status = 'resolved')::BIGINT as resolved_count,
    COALESCE(SUM(unread_count), 0)::BIGINT as unread_messages,
    COUNT(*) FILTER (WHERE assigned_to = p_user_id)::BIGINT as assigned_to_me
  FROM public.whatsapp_conversations
  WHERE 
    -- Filtro rápido por phone_number_id (indexado)
    (
      v_phone_number_ids IS NOT NULL 
      AND phone_number_id = ANY(v_phone_number_ids)
    )
    OR
    -- Fallback para conversas antigas/sem phone_number_id ou atribuídas diretamente
    (
      (phone_number_id IS NULL OR v_phone_number_ids IS NULL)
      AND (
        user_id = p_user_id
        OR assigned_to = p_user_id
        OR EXISTS (
          SELECT 1 FROM secretary_doctor_links
          WHERE secretary_id = p_user_id
          AND doctor_id = whatsapp_conversations.user_id
        )
      )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
