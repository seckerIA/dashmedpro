-- RLS Policies for whatsapp_conversation_analysis
DROP POLICY IF EXISTS "View analysis if conversation accessible" ON whatsapp_conversation_analysis;
CREATE POLICY "View analysis if conversation accessible"
ON whatsapp_conversation_analysis FOR SELECT
USING (
  conversation_id IN (SELECT id FROM whatsapp_conversations)
);

-- RLS Policies for whatsapp_ai_suggestions
DROP POLICY IF EXISTS "View suggestions if conversation accessible" ON whatsapp_ai_suggestions;
CREATE POLICY "View suggestions if conversation accessible"
ON whatsapp_ai_suggestions FOR SELECT
USING (
  conversation_id IN (SELECT id FROM whatsapp_conversations)
);

-- RLS Policies for whatsapp_ai_config
-- Allow Admins to manage ALL AI configs
CREATE POLICY "Admins can manage all AI configs"
ON whatsapp_ai_config
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);
