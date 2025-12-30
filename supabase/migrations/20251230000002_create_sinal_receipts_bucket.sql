-- Criar bucket para comprovantes de sinal
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'sinal-receipts',
  'sinal-receipts',
  false,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']::text[]
)
ON CONFLICT (id) DO NOTHING;

-- Políticas RLS para o bucket
CREATE POLICY "Users can upload sinal receipts"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'sinal-receipts');

CREATE POLICY "Users can view sinal receipts"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'sinal-receipts');

CREATE POLICY "Users can update their sinal receipts"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'sinal-receipts');

CREATE POLICY "Users can delete their sinal receipts"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'sinal-receipts');
