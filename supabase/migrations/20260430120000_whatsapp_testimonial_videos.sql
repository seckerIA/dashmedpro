-- =============================================================
-- Migração: Vídeos de depoimento + colunas auxiliares de qualificação
-- Data: 2026-04-30
-- Contexto: Implementação da ORDEM SAGRADA (PDF Jessica) — agente envia
-- vídeos de depoimento automaticamente após geração de valor e antes
-- de qualquer mensagem sobre preço/agendamento.
-- =============================================================

-- 1) Tabela de vídeos de depoimento (até 3 ativos por médico)
CREATE TABLE IF NOT EXISTS whatsapp_testimonial_videos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
  storage_path text NOT NULL, -- formato 'whatsapp-media/testimonials/<file>' OU só caminho dentro de whatsapp-media
  caption text,
  display_order int NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  duration_seconds int,
  mime_type text DEFAULT 'video/mp4',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_testimonial_videos_user_active
  ON whatsapp_testimonial_videos(user_id, is_active, display_order);

ALTER TABLE whatsapp_testimonial_videos ENABLE ROW LEVEL SECURITY;

-- 2) RLS: dono vê os próprios; secretária vê os do(s) médico(s) linkado(s)
DROP POLICY IF EXISTS "users_view_own_testimonial_videos" ON whatsapp_testimonial_videos;
DROP POLICY IF EXISTS "users_insert_own_testimonial_videos" ON whatsapp_testimonial_videos;
DROP POLICY IF EXISTS "users_update_own_testimonial_videos" ON whatsapp_testimonial_videos;
DROP POLICY IF EXISTS "users_delete_own_testimonial_videos" ON whatsapp_testimonial_videos;

CREATE POLICY "users_view_own_testimonial_videos" ON whatsapp_testimonial_videos
  FOR SELECT USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM secretary_doctor_links l
      WHERE l.secretary_id = auth.uid()
        AND l.doctor_id = whatsapp_testimonial_videos.user_id
        AND l.is_active = true
    )
  );

CREATE POLICY "users_insert_own_testimonial_videos" ON whatsapp_testimonial_videos
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "users_update_own_testimonial_videos" ON whatsapp_testimonial_videos
  FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "users_delete_own_testimonial_videos" ON whatsapp_testimonial_videos
  FOR DELETE USING (user_id = auth.uid());

-- 3) Colunas auxiliares na lead_qualifications
--   - videos_sent_at: timestamp do envio dos vídeos (idempotência — agent não reenvia)
--   - perfil_paciente: cinestesico|visual|auditivo|analitico (extraído pelo GPT-4o-mini)
ALTER TABLE whatsapp_lead_qualifications
  ADD COLUMN IF NOT EXISTS videos_sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS perfil_paciente text;

-- 4) Trigger de updated_at automático
CREATE OR REPLACE FUNCTION update_testimonial_videos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_testimonial_videos_updated_at ON whatsapp_testimonial_videos;
CREATE TRIGGER trg_testimonial_videos_updated_at
  BEFORE UPDATE ON whatsapp_testimonial_videos
  FOR EACH ROW EXECUTE FUNCTION update_testimonial_videos_updated_at();

COMMENT ON TABLE whatsapp_testimonial_videos IS
  'Vídeos de depoimento de pacientes — enviados automaticamente pelo agente IA na ORDEM SAGRADA, após geração de valor e antes de qualquer menção de preço/agendamento.';
