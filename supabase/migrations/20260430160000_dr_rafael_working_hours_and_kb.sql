-- Dr. Rafael: apenas em ambientes onde o perfil existe (evita FK 23503 no remoto genérico).

DO $$
DECLARE
  v_uid uuid := '8ce20d10-5c49-4bb1-b086-9c2e1ede286d'::uuid;
BEGIN
  IF EXISTS (SELECT 1 FROM public.profiles WHERE id = v_uid) THEN
    UPDATE public.whatsapp_ai_config
    SET
      knowledge_base = knowledge_base || E'

HORÁRIO DE ATENDIMENTO DO DR. RAFAEL
• Segunda, terça, quinta e sexta: consultas das 9h às 17h.
• Quarta-feira: somente manhã, das 8h às 12h (não atende à tarde).
• Vagas para marcar: use sempre os horários que o sistema mostrar na agenda em tempo real; não invente horários fora dessa lista.',
      updated_at = NOW()
    WHERE user_id = v_uid;

    DELETE FROM public.doctor_working_hours WHERE user_id = v_uid;

    INSERT INTO public.doctor_working_hours (user_id, day_of_week, start_time, end_time)
    VALUES
      (v_uid, 1, '09:00:00', '17:00:00'),
      (v_uid, 2, '09:00:00', '17:00:00'),
      (v_uid, 3, '08:00:00', '12:00:00'),
      (v_uid, 4, '09:00:00', '17:00:00'),
      (v_uid, 5, '09:00:00', '17:00:00');
  END IF;
END $$;
