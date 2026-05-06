-- ============================================
-- TABELA DE VINCULACAO SECRETARIA-MEDICO
-- ============================================
-- Uma secretaria pode ser vinculada a multiplos medicos
-- Ela so vera dados dos medicos vinculados

-- Criar tabela de vinculacao
CREATE TABLE IF NOT EXISTS public.secretary_doctor_links (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  secretary_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  doctor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(secretary_id, doctor_id)
);

-- Comentarios
COMMENT ON TABLE public.secretary_doctor_links IS 'Vinculacao entre secretarias e medicos. Uma secretaria pode estar vinculada a multiplos medicos.';
COMMENT ON COLUMN public.secretary_doctor_links.secretary_id IS 'ID do perfil da secretaria';
COMMENT ON COLUMN public.secretary_doctor_links.doctor_id IS 'ID do perfil do medico';

-- Indices para performance
CREATE INDEX IF NOT EXISTS idx_secretary_doctor_links_secretary ON public.secretary_doctor_links(secretary_id);
CREATE INDEX IF NOT EXISTS idx_secretary_doctor_links_doctor ON public.secretary_doctor_links(doctor_id);

-- Habilitar RLS
ALTER TABLE public.secretary_doctor_links ENABLE ROW LEVEL SECURITY;

-- Politica: Usuarios podem ver seus proprios vinculos
CREATE POLICY "Users can view their own links"
  ON public.secretary_doctor_links FOR SELECT
  TO authenticated
  USING (secretary_id = auth.uid() OR doctor_id = auth.uid());

-- Politica: Admins podem gerenciar todos os vinculos
CREATE POLICY "Admins can manage all links"
  ON public.secretary_doctor_links FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'dono')
    )
  );

-- Politica: Secretarias podem ver vinculos de medicos vinculados a elas
CREATE POLICY "Secretaries can view linked doctors data"
  ON public.secretary_doctor_links FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'secretaria'
    )
    AND secretary_id = auth.uid()
  );
