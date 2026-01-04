-- Enable pg_net extension if not enabled
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Function to trigger AI analysis
CREATE OR REPLACE FUNCTION public.trigger_whatsapp_ai_analysis()
RETURNS TRIGGER AS $$
DECLARE
  v_url text;
  v_service_key text;
  v_payload jsonb;
BEGIN
  -- Verificar se é mensagem inbound
  IF NEW.direction = 'inbound' THEN
    
    -- URL da Edge Function (Hardcoded ou buscada de config, vamos tentar construir dinâmica ou usar var)
    -- Ajuste a URL abaixo para a sua URL real do projeto Supabase
    v_url := 'https://adzaqkduxnpckbcuqpmg.supabase.co/functions/v1/whatsapp-ai-analyze';
    
    -- É difícil pegar secrets dentro do PL/PGSQL de forma segura sem vault, 
    -- vamos assumir que o anon key serve se a função validar RLS ou se usarmos service role.
    -- Para simplificar, vou assumir que a function aceita chamada com a service_role definidano header.
    -- IMPORTANTE: Voce precisará substituir a service_role_key aqui ou usar uma variável vault.
    -- Como não tenho a chave aqui, vou usar um header 'x-trigger-source': 'database-trigger' 
    -- e na function eu valido isso se necessário, ou confio na URL interna.
    
    -- Payload
    v_payload := jsonb_build_object(
      'conversation_id', NEW.conversation_id,
      'message_id', NEW.id
    );

    -- Chamada assíncrona via pg_net
    PERFORM net.http_post(
      url := v_url,
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', current_setting('request.header.authorization', true) -- Tenta repassar o auth atual ou falha
      ),
      body := v_payload
    );
    
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger
DROP TRIGGER IF EXISTS on_whatsapp_message_received ON public.whatsapp_messages;
CREATE TRIGGER on_whatsapp_message_received
  AFTER INSERT ON public.whatsapp_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_whatsapp_ai_analysis();
