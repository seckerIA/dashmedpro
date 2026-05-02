-- Automacao de estagios do pipeline (Kanban CRM)
-- 1) Lead responde no WhatsApp (mensagem inbound com contato vinculado) -> em_contato a partir de lead_novo
-- 2) Vinculo de contact_id na conversa (ex.: criacao pelo agente) -> mesma promocao
-- 3) Consulta criada/atualizada -> espelha regras de updateDealPipeline no servidor (contorna falhas de RLS no cliente)

-- Garantir valores de enum usados pelo frontend
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
    WHERE t.typname = 'crm_pipeline_stage' AND e.enumlabel = 'em_contato'
  ) THEN
    ALTER TYPE public.crm_pipeline_stage ADD VALUE 'em_contato';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
    WHERE t.typname = 'crm_pipeline_stage' AND e.enumlabel = 'follow_up'
  ) THEN
    ALTER TYPE public.crm_pipeline_stage ADD VALUE 'follow_up';
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.crm_promote_lead_novo_to_em_contato(p_contact_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_contact_id IS NULL THEN
    RETURN;
  END IF;

  UPDATE public.crm_deals d
  SET
    stage = 'em_contato'::public.crm_pipeline_stage,
    updated_at = now()
  WHERE d.contact_id = p_contact_id
    AND d.stage = 'lead_novo'::public.crm_pipeline_stage;
END;
$$;

COMMENT ON FUNCTION public.crm_promote_lead_novo_to_em_contato(uuid) IS
  'Move deals do contato de lead_novo para em_contato (ex.: primeira resposta no WhatsApp).';

CREATE OR REPLACE FUNCTION public.trg_whatsapp_inbound_promote_pipeline()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_contact uuid;
BEGIN
  IF NEW.direction IS DISTINCT FROM 'inbound' THEN
    RETURN NEW;
  END IF;

  v_contact := NEW.contact_id;

  IF v_contact IS NULL AND NEW.conversation_id IS NOT NULL THEN
    SELECT c.contact_id
    INTO v_contact
    FROM public.whatsapp_conversations c
    WHERE c.id = NEW.conversation_id;
  END IF;

  IF v_contact IS NOT NULL THEN
    PERFORM public.crm_promote_lead_novo_to_em_contato(v_contact);
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_whatsapp_inbound_promote_pipeline ON public.whatsapp_messages;

CREATE TRIGGER trg_whatsapp_inbound_promote_pipeline
  AFTER INSERT ON public.whatsapp_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_whatsapp_inbound_promote_pipeline();

CREATE OR REPLACE FUNCTION public.trg_conversation_contact_promote_pipeline()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'UPDATE'
     AND OLD.contact_id IS NULL
     AND NEW.contact_id IS NOT NULL THEN
    PERFORM public.crm_promote_lead_novo_to_em_contato(NEW.contact_id);
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_conversation_contact_promote_pipeline ON public.whatsapp_conversations;

CREATE TRIGGER trg_conversation_contact_promote_pipeline
  AFTER UPDATE OF contact_id ON public.whatsapp_conversations
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_conversation_contact_promote_pipeline();

CREATE OR REPLACE FUNCTION public.trg_medical_appointment_sync_deal_stage()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  pipeline_stage public.crm_pipeline_stage;
  is_def boolean;
  deal_val numeric;
  existing_deal record;
  doctor uuid;
  v_org uuid;
BEGIN
  doctor := COALESCE(NEW.doctor_id, NEW.user_id);

  IF NEW.contact_id IS NULL OR doctor IS NULL THEN
    RETURN NEW;
  END IF;

  IF NEW.status IN ('cancelled', 'no_show') THEN
    RETURN NEW;
  END IF;

  IF NEW.status = 'completed' THEN
    IF NEW.payment_status IN ('pending', 'partial') THEN
      pipeline_stage := 'inadimplente';
      is_def := true;
    ELSE
      pipeline_stage := 'follow_up';
      is_def := false;
    END IF;
  ELSIF COALESCE(NEW.sinal_amount, 0) > 0 THEN
    IF COALESCE(NEW.sinal_paid, false) THEN
      pipeline_stage := 'agendado';
      is_def := false;
    ELSE
      pipeline_stage := 'inadimplente';
      is_def := true;
    END IF;
  ELSE
    pipeline_stage := 'agendado';
    is_def := false;
  END IF;

  deal_val := COALESCE(NEW.estimated_value, NEW.sinal_amount, 0);

  SELECT d.id, d.stage, d.user_id
  INTO existing_deal
  FROM public.crm_deals d
  WHERE d.contact_id = NEW.contact_id
    AND d.stage NOT IN ('fechado_ganho'::public.crm_pipeline_stage, 'fechado_perdido'::public.crm_pipeline_stage)
  ORDER BY (d.stage = 'agendado'::public.crm_pipeline_stage) DESC, d.updated_at DESC NULLS LAST
  LIMIT 1;

  IF existing_deal.id IS NOT NULL THEN
    UPDATE public.crm_deals
    SET
      stage = pipeline_stage,
      is_defaulting = is_def,
      value = deal_val,
      updated_at = now()
    WHERE id = existing_deal.id;
  ELSE
    SELECT organization_id INTO v_org FROM public.crm_contacts WHERE id = NEW.contact_id LIMIT 1;

    INSERT INTO public.crm_deals (
      user_id,
      contact_id,
      title,
      value,
      stage,
      is_defaulting,
      organization_id
    )
    VALUES (
      doctor,
      NEW.contact_id,
      NEW.title,
      deal_val,
      pipeline_stage,
      is_def,
      v_org
    );
  END IF;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.trg_medical_appointment_sync_deal_stage() IS
  'Atualiza crm_deals ao criar/alterar consulta (mesma logica do updateDealPipeline no app).';

DROP TRIGGER IF EXISTS trg_medical_appointment_sync_deal_stage ON public.medical_appointments;

CREATE TRIGGER trg_medical_appointment_sync_deal_stage
  AFTER INSERT OR UPDATE OF status, payment_status, sinal_paid, sinal_amount, estimated_value, title, contact_id, doctor_id, user_id
  ON public.medical_appointments
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_medical_appointment_sync_deal_stage();
