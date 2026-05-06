-- Base URL do projeto Supabase usada por triggers e pg_cron (Edge Functions).
-- Após clonar o projeto em outro host, execute no SQL Editor do NOVO projeto:
--   UPDATE public.app_supabase_config SET api_url = 'https://SEU_REF.supabase.co' WHERE singleton = true;

CREATE EXTENSION IF NOT EXISTS pg_net;
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;

CREATE TABLE IF NOT EXISTS public.app_supabase_config (
  singleton boolean PRIMARY KEY DEFAULT true CHECK (singleton = true),
  api_url text NOT NULL
);

COMMENT ON TABLE public.app_supabase_config IS 'URL do projeto (https://ref.supabase.co) para pg_net/cron e triggers que chamam Edge Functions.';

INSERT INTO public.app_supabase_config (singleton, api_url)
VALUES (true, 'https://brrhnniybfabtnuxybal.supabase.co')
ON CONFLICT (singleton) DO NOTHING;

REVOKE ALL ON public.app_supabase_config FROM PUBLIC;

-- Trigger: análise IA em mensagem inbound
CREATE OR REPLACE FUNCTION public.trigger_whatsapp_ai_analysis()
RETURNS TRIGGER AS $$
DECLARE
  v_base text;
  v_url text;
  v_payload jsonb;
BEGIN
  IF NEW.direction <> 'inbound' THEN
    RETURN NEW;
  END IF;

  SELECT c.api_url INTO v_base
  FROM public.app_supabase_config c
  WHERE c.singleton = true;

  IF v_base IS NULL OR length(trim(v_base)) = 0 THEN
    RAISE WARNING 'app_supabase_config.api_url vazio; whatsapp-ai-analyze não chamado';
    RETURN NEW;
  END IF;

  v_url := rtrim(v_base, '/') || '/functions/v1/whatsapp-ai-analyze';

  v_payload := jsonb_build_object(
    'conversation_id', NEW.conversation_id,
    'message_id', NEW.id
  );

  PERFORM net.http_post(
    url := v_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', current_setting('request.header.authorization', true)
    ),
    body := v_payload
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_whatsapp_message_received ON public.whatsapp_messages;
CREATE TRIGGER on_whatsapp_message_received
  AFTER INSERT ON public.whatsapp_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_whatsapp_ai_analysis();

-- Cron: lembrete 2h (reagenda com URL lida da config a cada execução)
DO $$
DECLARE
  jid bigint;
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron')
     AND EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_net') THEN
    FOR jid IN
      SELECT jobid FROM cron.job WHERE jobname = 'appointment-reminder-2h'
    LOOP
      PERFORM cron.unschedule(jid);
    END LOOP;

    PERFORM cron.schedule(
      'appointment-reminder-2h',
      '*/5 * * * *',
      $job$
      SELECT net.http_post(
        url := (SELECT rtrim(api_url, '/') || '/functions/v1/appointment-reminder-cron'
                FROM public.app_supabase_config WHERE singleton = true LIMIT 1),
        headers := '{"Content-Type":"application/json"}'::jsonb,
        body := '{"source":"pg_cron"}'::jsonb
      );
      $job$
    );
  END IF;
END
$$;
