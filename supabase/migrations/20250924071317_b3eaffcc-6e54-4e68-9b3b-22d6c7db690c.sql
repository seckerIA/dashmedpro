-- Enable Row Level Security on all tables
ALTER TABLE public."BDR_PROSPECÇÃO" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."LEADS" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."SDR2" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contatos_agente ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follow_up ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follow_upp ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.n8n_chat_histories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sdr_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sdr_leads_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;

-- Create basic RLS policies for authenticated users
-- BDR_PROSPECÇÃO policies
CREATE POLICY "BDR_PROSPECÇÃO authenticated access" ON public."BDR_PROSPECÇÃO"
FOR ALL USING (auth.role() = 'authenticated');

-- LEADS policies  
CREATE POLICY "LEADS authenticated access" ON public."LEADS"
FOR ALL USING (auth.role() = 'authenticated');

-- SDR2 policies
CREATE POLICY "SDR2 authenticated access" ON public."SDR2"
FOR ALL USING (auth.role() = 'authenticated');

-- contatos_agente policies
CREATE POLICY "contatos_agente authenticated access" ON public.contatos_agente
FOR ALL USING (auth.role() = 'authenticated');

-- documents policies
CREATE POLICY "documents authenticated access" ON public.documents
FOR ALL USING (auth.role() = 'authenticated');

-- follow_up policies
CREATE POLICY "follow_up authenticated access" ON public.follow_up
FOR ALL USING (auth.role() = 'authenticated');

-- follow_upp policies
CREATE POLICY "follow_upp authenticated access" ON public.follow_upp
FOR ALL USING (auth.role() = 'authenticated');

-- n8n_chat_histories policies
CREATE POLICY "n8n_chat_histories authenticated access" ON public.n8n_chat_histories
FOR ALL USING (auth.role() = 'authenticated');

-- sdr_events policies
CREATE POLICY "sdr_events authenticated access" ON public.sdr_events
FOR ALL USING (auth.role() = 'authenticated');

-- sdr_leads_status policies
CREATE POLICY "sdr_leads_status authenticated access" ON public.sdr_leads_status
FOR ALL USING (auth.role() = 'authenticated');

-- users policies (user-specific access)
CREATE POLICY "users own data" ON public.users
FOR ALL USING (auth.uid() = id);

-- usuarios policies
CREATE POLICY "usuarios authenticated access" ON public.usuarios
FOR ALL USING (auth.role() = 'authenticated');

-- Fix function search path security issues
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.match_documents(query_embedding vector, match_count integer DEFAULT NULL::integer, filter jsonb DEFAULT '{}'::jsonb)
RETURNS TABLE(id bigint, content text, metadata jsonb, similarity double precision)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
#variable_conflict use_column
begin
  return query
  select
    id,
    content,
    metadata,
    1 - (documents.embedding <=> query_embedding) as similarity
  from documents
  where metadata @> filter
  order by documents.embedding <=> query_embedding
  limit match_count;
end;
$function$;