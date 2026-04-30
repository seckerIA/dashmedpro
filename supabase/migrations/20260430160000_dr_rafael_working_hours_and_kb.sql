-- Dr. Rafael: horário na base de conhecimento + expediente em doctor_working_hours (slots da IA)
-- user_id = conta WhatsApp / médico Jessica–Dr. Rafael

UPDATE public.whatsapp_ai_config
SET
  knowledge_base = knowledge_base || E'

HORÁRIO DE ATENDIMENTO DO DR. RAFAEL
• Segunda, terça, quinta e sexta: consultas das 9h às 17h.
• Quarta-feira: somente manhã, das 8h às 12h (não atende à tarde).
• Vagas para marcar: use sempre os horários que o sistema mostrar na agenda em tempo real; não invente horários fora dessa lista.',
  updated_at = NOW()
WHERE user_id = '8ce20d10-5c49-4bb1-b086-9c2e1ede286d';

DELETE FROM public.doctor_working_hours
WHERE user_id = '8ce20d10-5c49-4bb1-b086-9c2e1ede286d';

INSERT INTO public.doctor_working_hours (user_id, day_of_week, start_time, end_time)
VALUES
  ('8ce20d10-5c49-4bb1-b086-9c2e1ede286d', 1, '09:00:00', '17:00:00'),
  ('8ce20d10-5c49-4bb1-b086-9c2e1ede286d', 2, '09:00:00', '17:00:00'),
  ('8ce20d10-5c49-4bb1-b086-9c2e1ede286d', 3, '08:00:00', '12:00:00'),
  ('8ce20d10-5c49-4bb1-b086-9c2e1ede286d', 4, '09:00:00', '17:00:00'),
  ('8ce20d10-5c49-4bb1-b086-9c2e1ede286d', 5, '09:00:00', '17:00:00');
