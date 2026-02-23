-- Drop the legacy database trigger that calls whatsapp-ai-analyze
-- This trigger was causing DOUBLE RESPONSES because:
-- 1. The webhook already calls whatsapp-ai-agent (new) via fetch
-- 2. This trigger was also calling whatsapp-ai-analyze (legacy) via pg_net
-- Result: two different functions responding to the same message

DROP TRIGGER IF EXISTS on_whatsapp_message_received ON public.whatsapp_messages;

-- Keep the function definition for reference but it's no longer triggered
-- DROP FUNCTION IF EXISTS public.trigger_whatsapp_ai_analysis();
