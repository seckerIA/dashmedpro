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
  v_org_ids UUID[];
BEGIN
  -- 1. Get user organizations (fast STABLE function)
  v_org_ids := public.get_user_org_ids();

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
    -- Primary filter: Organization (uses index)
    organization_id = ANY(v_org_ids)
    
    -- Secondary role-based access logic
    AND (
       assigned_to = p_user_id
       OR 
       phone_number_id IN (
          SELECT phone_number_id 
          FROM whatsapp_config 
          WHERE organization_id = ANY(v_org_ids)
          AND is_active = true
       )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
