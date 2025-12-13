-- Create pipeline stage enum
CREATE TYPE public.crm_pipeline_stage AS ENUM (
  'lead_novo', 'qualificado', 'apresentacao', 'proposta', 'negociacao', 'fechado_ganho', 'fechado_perdido'
);

-- Create activity type enum
CREATE TYPE public.crm_activity_type AS ENUM (
  'call', 'email', 'whatsapp', 'meeting', 'note', 'task', 'ai_interaction'
);

-- Add missing columns to crm_contacts
ALTER TABLE public.crm_contacts 
  ADD COLUMN IF NOT EXISTS full_name TEXT,
  ADD COLUMN IF NOT EXISTS service TEXT,
  ADD COLUMN IF NOT EXISTS service_value DECIMAL(15,2),
  ADD COLUMN IF NOT EXISTS tags TEXT[];

-- Create crm_deals table (different from the generic deals table)
CREATE TABLE public.crm_deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID REFERENCES public.crm_contacts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  value DECIMAL(15,2) DEFAULT 0,
  stage crm_pipeline_stage DEFAULT 'lead_novo',
  probability INTEGER DEFAULT 0,
  expected_close_date DATE,
  needs_follow_up BOOLEAN DEFAULT false,
  notes TEXT,
  service TEXT,
  position INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.crm_deals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view crm_deals" ON public.crm_deals
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can manage crm_deals" ON public.crm_deals
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TRIGGER update_crm_deals_updated_at BEFORE UPDATE ON public.crm_deals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create crm_activities table
CREATE TABLE public.crm_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID REFERENCES public.crm_contacts(id) ON DELETE CASCADE,
  deal_id UUID REFERENCES public.crm_deals(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  type crm_activity_type NOT NULL,
  title TEXT,
  description TEXT,
  scheduled_at TIMESTAMPTZ,
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.crm_activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view crm_activities" ON public.crm_activities
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can manage crm_activities" ON public.crm_activities
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Fix notify_n8n_on_msg_enviada function search path
CREATE OR REPLACE FUNCTION public.notify_n8n_on_msg_enviada()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  request_id bigint;
BEGIN
  IF NEW."MSG Enviada" = FALSE THEN
    SELECT net.http_post(
      url := 'https://n8n.assessorianextmed.com/webhook/script_supa',
      headers := '{"Content-Type": "application/json"}'::jsonb,
      body := jsonb_build_object(
        'id', NEW.id,
        'number', NEW.number,
        'lead_name', NEW.lead_name,
        'status', NEW.status,
        'etapa', NEW.etapa,
        'created_at', NEW.created_at,
        'ultimo_contato', NEW.ultimo_contato,
        'resumo', NEW.resumo,
        'assunto', NEW.assunto,
        'interacoes', NEW.interacoes,
        'event', 'msg_enviada_changed',
        'timestamp', NOW()
      )
    ) INTO request_id;
  END IF;
  RETURN NEW;
END;
$function$;