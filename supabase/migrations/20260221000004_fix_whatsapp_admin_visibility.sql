-- Allow Admins and Donos to VIEW ALL WhatsApp Configs
DROP POLICY IF EXISTS "Admins can view all whatsapp configs" ON whatsapp_config;
CREATE POLICY "Admins can view all whatsapp configs"
  ON whatsapp_config
  FOR SELECT
  USING (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.role in ('admin', 'dono')
    )
  );

-- Allow Doctors to view linked Secretaries' Configs
DROP POLICY IF EXISTS "Doctors can view linked secretaries whatsapp configs" ON whatsapp_config;
CREATE POLICY "Doctors can view linked secretaries whatsapp configs"
  ON whatsapp_config
  FOR SELECT
  USING (
    exists (
      select 1 from secretary_doctor_links
      where doctor_id = auth.uid()
      and secretary_id = whatsapp_config.user_id
    )
  );

-- Allow Secretaries to view linked Doctors' Configs
DROP POLICY IF EXISTS "Secretaries can view linked doctors whatsapp configs" ON whatsapp_config;
CREATE POLICY "Secretaries can view linked doctors whatsapp configs"
  ON whatsapp_config
  FOR SELECT
  USING (
    exists (
      select 1 from secretary_doctor_links
      where secretary_id = auth.uid()
      and doctor_id = whatsapp_config.user_id
    )
  );

-- Allow Admins, Donos, and Linked Users to VIEW ALL WhatsApp Conversations
DROP POLICY IF EXISTS "Unified view policy for whatsapp conversations" ON whatsapp_conversations;
CREATE POLICY "Unified view policy for whatsapp conversations"
  ON whatsapp_conversations
  FOR SELECT
  USING (
    -- 1. Is Owner
    user_id = auth.uid()
    OR
    -- 2. Is Admin/Dono
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.role in ('admin', 'dono')
    )
    OR
    -- 3. Is Doctor viewing Linked Secretary
    exists (
      select 1 from secretary_doctor_links
      where doctor_id = auth.uid()
      and secretary_id = whatsapp_conversations.user_id
    )
    OR
    -- 4. Is Secretary viewing Linked Doctor
    exists (
      select 1 from secretary_doctor_links
      where secretary_id = auth.uid()
      and doctor_id = whatsapp_conversations.user_id
    )
  );

-- Allow Admins and Linked Users to VIEW ALL WhatsApp Messages
DROP POLICY IF EXISTS "Unified view policy for whatsapp messages" ON whatsapp_messages;
CREATE POLICY "Unified view policy for whatsapp messages"
  ON whatsapp_messages
  FOR SELECT
  USING (
    exists (
      select 1 from whatsapp_conversations
      where id = whatsapp_messages.conversation_id
      and (
        -- Replicate logic from conversations (or simpler: just verify access to conversation)
        -- Ideally, we just check if user has access to the parent conversation
        -- But for performance, we might duplicate the checks or use a fast lookup
        user_id = auth.uid()
        OR
        exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role in ('admin', 'dono'))
        OR
        exists (select 1 from secretary_doctor_links where doctor_id = auth.uid() and secretary_id = whatsapp_conversations.user_id)
        OR
        exists (select 1 from secretary_doctor_links where secretary_id = auth.uid() and doctor_id = whatsapp_conversations.user_id)
      )
    )
  );

-- Allow Admins and Donos to UPDATE WhatsApp Configs (to enable/disable)
DROP POLICY IF EXISTS "Admins can update all whatsapp configs" ON whatsapp_config;
CREATE POLICY "Admins can update all whatsapp configs"
  ON whatsapp_config
  FOR UPDATE
  USING (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.role in ('admin', 'dono')
    )
  );
