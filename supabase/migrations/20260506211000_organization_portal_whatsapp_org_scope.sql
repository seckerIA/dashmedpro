-- White-label portal settings + WhatsApp dados escopados por organization_id

-- ============================================================
-- 1) organizations.portal_settings (JSON configurável por tenant)
-- ============================================================
ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS portal_settings jsonb NOT NULL DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.organizations.portal_settings IS
  'Tenant UI: branding (primary_hsl, logo_url, sidebar_title), features (crm_intelligence_tab, navigation_ai). Defaults no app quando chave ausente.';

-- ============================================================
-- 2) whatsapp_config.organization_id (+ backfill para isolamento por org)
-- ============================================================
ALTER TABLE public.whatsapp_config
  ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_whatsapp_config_organization_id ON public.whatsapp_config(organization_id);

UPDATE public.whatsapp_config wc
SET organization_id = p.organization_id
FROM public.profiles p
WHERE wc.user_id = p.id
  AND wc.organization_id IS NULL
  AND p.organization_id IS NOT NULL;

-- ============================================================
-- 3) whatsapp_conversations / whatsapp_messages (se já existirem cols, IF NOT EXISTS)
-- ============================================================
ALTER TABLE public.whatsapp_conversations
  ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id) ON DELETE SET NULL;

ALTER TABLE public.whatsapp_messages
  ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_whatsapp_conversations_organization_id ON public.whatsapp_conversations(organization_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_organization_id ON public.whatsapp_messages(organization_id);

UPDATE public.whatsapp_conversations c
SET organization_id = p.organization_id
FROM public.profiles p
WHERE c.user_id = p.id
  AND c.organization_id IS NULL
  AND p.organization_id IS NOT NULL;

UPDATE public.whatsapp_conversations c
SET organization_id = wc.organization_id
FROM public.whatsapp_config wc
WHERE c.organization_id IS NULL
  AND c.phone_number_id IS NOT NULL
  AND wc.phone_number_id = c.phone_number_id
  AND wc.organization_id IS NOT NULL;

UPDATE public.whatsapp_messages m
SET organization_id = c.organization_id
FROM public.whatsapp_conversations c
WHERE m.conversation_id = c.id
  AND m.organization_id IS NULL
  AND c.organization_id IS NOT NULL;

-- ============================================================
-- 4) Triggers para preencher organization_id automaticamente
-- ============================================================
CREATE OR REPLACE FUNCTION public.set_whatsapp_config_organization_id()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.organization_id IS NULL AND NEW.user_id IS NOT NULL THEN
    SELECT p.organization_id INTO NEW.organization_id
    FROM public.profiles p WHERE p.id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_whatsapp_config_set_organization ON public.whatsapp_config;

CREATE TRIGGER trg_whatsapp_config_set_organization
  BEFORE INSERT OR UPDATE OF user_id ON public.whatsapp_config
  FOR EACH ROW
  EXECUTE FUNCTION public.set_whatsapp_config_organization_id();

CREATE OR REPLACE FUNCTION public.set_whatsapp_conversation_organization_id()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.organization_id IS NULL THEN
    IF NEW.user_id IS NOT NULL THEN
      SELECT p.organization_id INTO NEW.organization_id
      FROM public.profiles p WHERE p.id = NEW.user_id;
    END IF;
    IF NEW.organization_id IS NULL AND NEW.phone_number_id IS NOT NULL THEN
      SELECT wc.organization_id INTO NEW.organization_id
      FROM public.whatsapp_config wc
      WHERE wc.phone_number_id = NEW.phone_number_id
        AND wc.organization_id IS NOT NULL
      LIMIT 1;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_whatsapp_conversations_set_organization ON public.whatsapp_conversations;

CREATE TRIGGER trg_whatsapp_conversations_set_organization
  BEFORE INSERT OR UPDATE OF user_id, phone_number_id ON public.whatsapp_conversations
  FOR EACH ROW
  EXECUTE FUNCTION public.set_whatsapp_conversation_organization_id();

CREATE OR REPLACE FUNCTION public.set_whatsapp_message_organization_id()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.organization_id IS NULL AND NEW.conversation_id IS NOT NULL THEN
    SELECT c.organization_id INTO NEW.organization_id
    FROM public.whatsapp_conversations c WHERE c.id = NEW.conversation_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_whatsapp_messages_set_organization ON public.whatsapp_messages;

CREATE TRIGGER trg_whatsapp_messages_set_organization
  BEFORE INSERT OR UPDATE OF conversation_id ON public.whatsapp_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.set_whatsapp_message_organization_id();

-- ============================================================
-- 5) RLS — remover políticas legadas/ampliadas e reaplicar com org
-- ============================================================
DROP POLICY IF EXISTS "whatsapp_config_select_own" ON public.whatsapp_config;
DROP POLICY IF EXISTS "whatsapp_config_insert_own" ON public.whatsapp_config;
DROP POLICY IF EXISTS "whatsapp_config_update_own" ON public.whatsapp_config;
DROP POLICY IF EXISTS "whatsapp_config_delete_own" ON public.whatsapp_config;
DROP POLICY IF EXISTS "Admins can view all whatsapp configs" ON public.whatsapp_config;
DROP POLICY IF EXISTS "Doctors can view linked secretaries whatsapp configs" ON public.whatsapp_config;
DROP POLICY IF EXISTS "Secretaries can view linked doctors whatsapp configs" ON public.whatsapp_config;
DROP POLICY IF EXISTS "Admins can update all whatsapp configs" ON public.whatsapp_config;

DROP POLICY IF EXISTS "whatsapp_conversations_select" ON public.whatsapp_conversations;
DROP POLICY IF EXISTS "whatsapp_conversations_insert" ON public.whatsapp_conversations;
DROP POLICY IF EXISTS "whatsapp_conversations_update" ON public.whatsapp_conversations;
DROP POLICY IF EXISTS "whatsapp_conversations_delete" ON public.whatsapp_conversations;
DROP POLICY IF EXISTS "Unified view policy for whatsapp conversations" ON public.whatsapp_conversations;
DROP POLICY IF EXISTS "Conversations access policy" ON public.whatsapp_conversations;

DROP POLICY IF EXISTS "whatsapp_messages_select" ON public.whatsapp_messages;
DROP POLICY IF EXISTS "whatsapp_messages_insert" ON public.whatsapp_messages;
DROP POLICY IF EXISTS "whatsapp_messages_update" ON public.whatsapp_messages;
DROP POLICY IF EXISTS "Unified view policy for whatsapp messages" ON public.whatsapp_messages;

-- ------- whatsapp_config -------
CREATE POLICY "whatsapp_config_org_select"
  ON public.whatsapp_config FOR SELECT
  USING (
    organization_id IS NOT NULL
    AND organization_id = ANY (public.get_user_org_ids())
    AND (
      user_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM public.secretary_doctor_links sdl
        WHERE sdl.doctor_id = auth.uid()
          AND sdl.secretary_id = whatsapp_config.user_id
      )
      OR EXISTS (
        SELECT 1 FROM public.secretary_doctor_links sdl
        WHERE sdl.secretary_id = auth.uid()
          AND sdl.doctor_id = whatsapp_config.user_id
      )
      OR EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = auth.uid()
          AND p.role IN ('admin', 'dono')
      )
    )
  );

CREATE POLICY "whatsapp_config_org_insert"
  ON public.whatsapp_config FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND organization_id IS NOT NULL
    AND organization_id = ANY (public.get_user_org_ids())
  );

CREATE POLICY "whatsapp_config_org_update"
  ON public.whatsapp_config FOR UPDATE
  USING (
    organization_id IS NOT NULL
    AND organization_id = ANY (public.get_user_org_ids())
    AND (
      user_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = auth.uid()
          AND p.role IN ('admin', 'dono')
      )
    )
  )
  WITH CHECK (
    organization_id IS NOT NULL
    AND organization_id = ANY (public.get_user_org_ids())
  );

CREATE POLICY "whatsapp_config_org_delete"
  ON public.whatsapp_config FOR DELETE
  USING (
    organization_id IS NOT NULL
    AND organization_id = ANY (public.get_user_org_ids())
    AND user_id = auth.uid()
  );

-- ------- whatsapp_conversations -------
CREATE POLICY "whatsapp_conversations_org_select"
  ON public.whatsapp_conversations FOR SELECT
  USING (
    organization_id IS NOT NULL
    AND organization_id = ANY (public.get_user_org_ids())
    AND (
      EXISTS (
        SELECT 1 FROM public.whatsapp_config wc
        WHERE wc.phone_number_id = whatsapp_conversations.phone_number_id
          AND wc.is_active = true
          AND (
            wc.user_id = auth.uid()
            OR EXISTS (
              SELECT 1 FROM public.secretary_doctor_links sdl
              WHERE sdl.secretary_id = auth.uid()
                AND sdl.doctor_id = wc.user_id
            )
            OR EXISTS (
              SELECT 1 FROM public.secretary_doctor_links sdl
              WHERE sdl.doctor_id = auth.uid()
                AND sdl.secretary_id = wc.user_id
            )
          )
      )
      OR (
        whatsapp_conversations.phone_number_id IS NULL
        AND (
          user_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM public.secretary_doctor_links sdl
            WHERE sdl.secretary_id = auth.uid()
              AND sdl.doctor_id = whatsapp_conversations.user_id
          )
          OR EXISTS (
            SELECT 1 FROM public.secretary_doctor_links sdl
            WHERE sdl.doctor_id = auth.uid()
              AND sdl.secretary_id = whatsapp_conversations.user_id
          )
        )
      )
    )
  );

CREATE POLICY "whatsapp_conversations_org_insert"
  ON public.whatsapp_conversations FOR INSERT
  WITH CHECK (
    organization_id IS NOT NULL
    AND organization_id = ANY (public.get_user_org_ids())
    AND (
      EXISTS (
        SELECT 1 FROM public.whatsapp_config wc
        WHERE wc.phone_number_id = whatsapp_conversations.phone_number_id
          AND wc.is_active = true
          AND (
            wc.user_id = auth.uid()
            OR EXISTS (
              SELECT 1 FROM public.secretary_doctor_links sdl
              WHERE sdl.secretary_id = auth.uid()
                AND sdl.doctor_id = wc.user_id
            )
            OR EXISTS (
              SELECT 1 FROM public.secretary_doctor_links sdl
              WHERE sdl.doctor_id = auth.uid()
                AND sdl.secretary_id = wc.user_id
            )
          )
      )
      OR whatsapp_conversations.phone_number_id IS NULL
    )
  );

CREATE POLICY "whatsapp_conversations_org_update"
  ON public.whatsapp_conversations FOR UPDATE
  USING (
    organization_id IS NOT NULL
    AND organization_id = ANY (public.get_user_org_ids())
    AND (
      EXISTS (
        SELECT 1 FROM public.whatsapp_config wc
        WHERE wc.phone_number_id = whatsapp_conversations.phone_number_id
          AND wc.is_active = true
          AND (
            wc.user_id = auth.uid()
            OR EXISTS (
              SELECT 1 FROM public.secretary_doctor_links sdl
              WHERE sdl.secretary_id = auth.uid()
                AND sdl.doctor_id = wc.user_id
            )
            OR EXISTS (
              SELECT 1 FROM public.secretary_doctor_links sdl
              WHERE sdl.doctor_id = auth.uid()
                AND sdl.secretary_id = wc.user_id
            )
          )
      )
      OR (
        whatsapp_conversations.phone_number_id IS NULL
        AND auth.uid() = user_id
      )
    )
  )
  WITH CHECK (
    organization_id IS NOT NULL
    AND organization_id = ANY (public.get_user_org_ids())
  );

CREATE POLICY "whatsapp_conversations_org_delete"
  ON public.whatsapp_conversations FOR DELETE
  USING (
    organization_id IS NOT NULL
    AND organization_id = ANY (public.get_user_org_ids())
    AND auth.uid() = user_id
  );

-- ------- whatsapp_messages -------
CREATE POLICY "whatsapp_messages_org_select"
  ON public.whatsapp_messages FOR SELECT
  USING (
    organization_id IS NOT NULL
    AND organization_id = ANY (public.get_user_org_ids())
    AND (
      EXISTS (
        SELECT 1 FROM public.whatsapp_config wc
        WHERE wc.phone_number_id = whatsapp_messages.phone_number_id
          AND wc.is_active = true
          AND (
            wc.user_id = auth.uid()
            OR EXISTS (
              SELECT 1 FROM public.secretary_doctor_links sdl
              WHERE sdl.secretary_id = auth.uid()
                AND sdl.doctor_id = wc.user_id
            )
            OR EXISTS (
              SELECT 1 FROM public.secretary_doctor_links sdl
              WHERE sdl.doctor_id = auth.uid()
                AND sdl.secretary_id = wc.user_id
            )
          )
      )
      OR (
        whatsapp_messages.phone_number_id IS NULL
        AND EXISTS (
          SELECT 1 FROM public.whatsapp_conversations c
          WHERE c.id = whatsapp_messages.conversation_id
            AND (
              c.user_id = auth.uid()
              OR EXISTS (
                SELECT 1 FROM public.secretary_doctor_links sdl
                WHERE sdl.secretary_id = auth.uid()
                  AND sdl.doctor_id = c.user_id
              )
              OR EXISTS (
                SELECT 1 FROM public.secretary_doctor_links sdl
                WHERE sdl.doctor_id = auth.uid()
                  AND sdl.secretary_id = c.user_id
              )
            )
        )
      )
    )
  );

CREATE POLICY "whatsapp_messages_org_insert"
  ON public.whatsapp_messages FOR INSERT
  WITH CHECK (
    organization_id IS NOT NULL
    AND organization_id = ANY (public.get_user_org_ids())
    AND (
      EXISTS (
        SELECT 1 FROM public.whatsapp_config wc
        WHERE wc.phone_number_id = whatsapp_messages.phone_number_id
          AND wc.is_active = true
          AND (
            wc.user_id = auth.uid()
            OR EXISTS (
              SELECT 1 FROM public.secretary_doctor_links sdl
              WHERE sdl.secretary_id = auth.uid()
                AND sdl.doctor_id = wc.user_id
            )
            OR EXISTS (
              SELECT 1 FROM public.secretary_doctor_links sdl
              WHERE sdl.doctor_id = auth.uid()
                AND sdl.secretary_id = wc.user_id
            )
          )
      )
      OR whatsapp_messages.phone_number_id IS NULL
    )
  );

CREATE POLICY "whatsapp_messages_org_update"
  ON public.whatsapp_messages FOR UPDATE
  USING (
    organization_id IS NOT NULL
    AND organization_id = ANY (public.get_user_org_ids())
    AND (
      user_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM public.whatsapp_config wc
        WHERE wc.phone_number_id = whatsapp_messages.phone_number_id
          AND wc.is_active = true
          AND (
            wc.user_id = auth.uid()
            OR EXISTS (
              SELECT 1 FROM public.secretary_doctor_links sdl
              WHERE sdl.secretary_id = auth.uid()
                AND sdl.doctor_id = wc.user_id
            )
            OR EXISTS (
              SELECT 1 FROM public.secretary_doctor_links sdl
              WHERE sdl.doctor_id = auth.uid()
                AND sdl.secretary_id = wc.user_id
            )
          )
      )
    )
  )
  WITH CHECK (
    organization_id IS NOT NULL
    AND organization_id = ANY (public.get_user_org_ids())
  );
