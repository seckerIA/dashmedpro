-- =====================================================
-- MÉTRICAS FANTASMA PARA DR. CARLOS (CORRIGIDO)
-- Simula uso do dashboard por 15-30 dias
-- Execute após criar o usuário Dr. Carlos
-- =====================================================

DO $$
DECLARE
    v_dr_carlos_id UUID;
    v_contact_id UUID;
    v_deal_id UUID;
    v_appointment_id UUID;
    v_transaction_id UUID;
    v_conversation_id UUID;
    v_i INTEGER;
    v_j INTEGER;
    v_random_date TIMESTAMP;
    v_random_value DECIMAL;
    v_procedures TEXT[] := ARRAY['Botox', 'Preenchimento Labial', 'Harmonização Facial', 'Peeling Químico', 'Laser Facial', 'Limpeza de Pele', 'Consulta Inicial'];
    v_first_names TEXT[] := ARRAY['Ana', 'Maria', 'João', 'Pedro', 'Carla', 'Lucas', 'Fernanda', 'Ricardo', 'Juliana', 'Rafael', 'Patrícia', 'Bruno', 'Camila', 'Thiago', 'Larissa'];
    v_last_names TEXT[] := ARRAY['Silva', 'Santos', 'Oliveira', 'Souza', 'Rodrigues', 'Ferreira', 'Alves', 'Pereira', 'Lima', 'Gomes', 'Costa', 'Ribeiro', 'Martins', 'Carvalho', 'Almeida'];
BEGIN
    -- Buscar ID do Dr. Carlos
    SELECT id INTO v_dr_carlos_id 
    FROM auth.users 
    WHERE email = 'dr.carlos@dashmedpro.com';
    
    IF v_dr_carlos_id IS NULL THEN
        RAISE EXCEPTION 'Dr. Carlos não encontrado. Crie o usuário primeiro!';
    END IF;
    
    RAISE NOTICE 'Gerando dados para Dr. Carlos (ID: %)', v_dr_carlos_id;
    
    -- =====================================================
    -- 1. CRIAR CONTATOS (15-25 contatos)
    -- =====================================================
    FOR v_i IN 1..20 LOOP
        v_contact_id := gen_random_uuid();
        v_random_date := NOW() - (floor(random() * 30) || ' days')::interval - (floor(random() * 24) || ' hours')::interval;
        
        INSERT INTO public.crm_contacts (
            id, user_id, full_name, email, phone, company, lead_score, 
            created_at, updated_at, last_contact_at
        ) VALUES (
            v_contact_id,
            v_dr_carlos_id,
            v_first_names[1 + floor(random() * 15)::int] || ' ' || v_last_names[1 + floor(random() * 15)::int],
            'paciente' || v_i || '@email.com',
            '+5511' || (90000000 + floor(random() * 9999999))::text,
            CASE WHEN random() > 0.7 THEN 'Empresa ' || chr(65 + floor(random() * 26)::int) ELSE NULL END,
            floor(random() * 100)::int,
            v_random_date,
            v_random_date + interval '2 hours',
            v_random_date + (floor(random() * 5) || ' days')::interval
        );
        
        -- =====================================================
        -- 2. CRIAR DEALS (1-2 por contato)
        -- =====================================================
        IF random() > 0.3 THEN
            v_deal_id := gen_random_uuid();
            v_random_value := 500 + floor(random() * 4500);
            
            INSERT INTO public.crm_deals (
                id, user_id, contact_id, title, description, value, 
                stage, probability, created_at, updated_at
            ) VALUES (
                v_deal_id,
                v_dr_carlos_id,
                v_contact_id,
                v_procedures[1 + floor(random() * 7)::int] || ' - Paciente ' || v_i,
                'Procedimento estético solicitado via WhatsApp',
                v_random_value,
                (ARRAY['lead_novo', 'qualificado', 'apresentacao', 'proposta', 'negociacao', 'fechado_ganho', 'fechado_perdido'])[1 + floor(random() * 7)::int]::crm_pipeline_stage,
                floor(random() * 100)::int,
                v_random_date,
                v_random_date + interval '1 day'
            );
        END IF;
        
        -- =====================================================
        -- 3. CRIAR AGENDAMENTOS (0-2 por contato)
        -- =====================================================
        IF random() > 0.4 THEN
            v_appointment_id := gen_random_uuid();
            v_random_date := NOW() - (floor(random() * 25) || ' days')::interval;
            -- Ajustar para horário comercial (8h-18h)
            v_random_date := date_trunc('day', v_random_date) + (8 + floor(random() * 10)) * interval '1 hour';
            
            INSERT INTO public.medical_appointments (
                id, user_id, contact_id, title, appointment_type, status,
                start_time, end_time, duration_minutes, notes,
                estimated_value, payment_status, created_at, updated_at
            ) VALUES (
                v_appointment_id,
                v_dr_carlos_id,
                v_contact_id,
                v_procedures[1 + floor(random() * 7)::int],
                (ARRAY['first_visit', 'return', 'procedure', 'follow_up'])[1 + floor(random() * 4)::int]::appointment_type,
                CASE 
                    WHEN v_random_date < NOW() - interval '3 days' THEN 
                        (ARRAY['completed', 'cancelled', 'no_show'])[1 + floor(random() * 3)::int]::appointment_status
                    ELSE 
                        (ARRAY['scheduled', 'confirmed'])[1 + floor(random() * 2)::int]::appointment_status
                END,
                v_random_date,
                v_random_date + interval '30 minutes',
                30,
                'Agendamento gerado automaticamente para demonstração',
                200 + floor(random() * 1800),
                (ARRAY['pending', 'paid', 'partial'])[1 + floor(random() * 3)::int]::payment_status,
                v_random_date - interval '2 days',
                v_random_date - interval '1 day'
            );
        END IF;
    END LOOP;
    
    RAISE NOTICE '✅ Contatos, Deals e Agendamentos criados!';
    
    -- =====================================================
    -- 4. CRIAR LEADS COMERCIAIS (10-15 leads)
    -- =====================================================
    FOR v_i IN 1..12 LOOP
        v_random_date := NOW() - (floor(random() * 30) || ' days')::interval;
        
        INSERT INTO public.commercial_leads (
            user_id, name, email, phone, origin, status, 
            estimated_value, notes, created_at, updated_at
        ) VALUES (
            v_dr_carlos_id,
            v_first_names[1 + floor(random() * 15)::int] || ' ' || v_last_names[1 + floor(random() * 15)::int],
            'lead' || v_i || '@email.com',
            '+5511' || (80000000 + floor(random() * 9999999))::text,
            (ARRAY['google', 'instagram', 'facebook', 'indication', 'website', 'other'])[1 + floor(random() * 6)::int]::commercial_lead_origin,
            (ARRAY['new', 'contacted', 'qualified', 'converted', 'lost'])[1 + floor(random() * 5)::int]::commercial_lead_status,
            1000 + floor(random() * 4000),
            'Lead captado via campanha de marketing',
            v_random_date,
            v_random_date + interval '1 day'
        );
    END LOOP;
    
    RAISE NOTICE '✅ Leads comerciais criados!';
    
    -- =====================================================
    -- 5. CRIAR TRANSAÇÕES FINANCEIRAS (20-30 transações)
    -- =====================================================
    -- Primeiro, criar uma conta financeira para o Dr. Carlos
    INSERT INTO public.financial_accounts (user_id, name, type, bank_name, initial_balance, current_balance, is_active)
    VALUES (v_dr_carlos_id, 'Conta Principal', 'conta_corrente', 'Banco do Brasil', 10000, 25000, true)
    ON CONFLICT DO NOTHING;
    
    FOR v_i IN 1..25 LOOP
        v_random_date := NOW() - (floor(random() * 30) || ' days')::interval;
        v_random_value := 100 + floor(random() * 2900);
        
        INSERT INTO public.financial_transactions (
            user_id, type, amount, description, date, 
            payment_method, status, notes, created_at, updated_at
        ) VALUES (
            v_dr_carlos_id,
            CASE WHEN random() > 0.3 THEN 'entrada' ELSE 'saida' END::transaction_type,
            v_random_value,
            CASE WHEN random() > 0.3 
                THEN v_procedures[1 + floor(random() * 7)::int] || ' - Paciente'
                ELSE 'Despesa operacional'
            END,
            v_random_date::date,
            (ARRAY['pix', 'cartao_credito', 'cartao_debito', 'dinheiro'])[1 + floor(random() * 4)::int]::payment_method,
            CASE WHEN v_random_date < NOW() - interval '5 days' THEN 'concluida' ELSE 'pendente' END::transaction_status,
            'Transação gerada para demonstração',
            v_random_date,
            v_random_date
        );
    END LOOP;
    
    RAISE NOTICE '✅ Transações financeiras criadas!';
    
    -- =====================================================
    -- 6. CRIAR TAREFAS (8-12 tarefas)
    -- =====================================================
    FOR v_i IN 1..10 LOOP
        v_random_date := NOW() - (floor(random() * 20) || ' days')::interval;
        
        INSERT INTO public.tasks (
            user_id, created_by, title, description, status, priority,
            due_date, created_at, updated_at
        ) VALUES (
            v_dr_carlos_id,
            v_dr_carlos_id,
            (ARRAY['Ligar para paciente', 'Enviar orçamento', 'Confirmar agendamento', 'Revisar prontuário', 'Atualizar cadastro', 'Acompanhamento pós-procedimento'])[1 + floor(random() * 6)::int],
            'Tarefa gerada automaticamente para demonstração',
            (ARRAY['pendente', 'em_andamento', 'concluida', 'cancelada'])[1 + floor(random() * 4)::int]::task_status,
            (ARRAY['baixa', 'media', 'alta', 'urgente'])[1 + floor(random() * 4)::int]::task_priority,
            (v_random_date + (floor(random() * 14) || ' days')::interval)::date,
            v_random_date,
            v_random_date + interval '1 hour'
        );
    END LOOP;
    
    RAISE NOTICE '✅ Tarefas criadas!';
    
    -- =====================================================
    -- 7. CRIAR CONVERSAS WHATSAPP (5-8 conversas)
    -- Usando o tipo correto: whatsapp_conversation_status
    -- =====================================================
    FOR v_i IN 1..6 LOOP
        v_conversation_id := gen_random_uuid();
        v_random_date := NOW() - (floor(random() * 25) || ' days')::interval;
        
        INSERT INTO public.whatsapp_conversations (
            id, user_id, phone_number, contact_name, status,
            last_message_at, last_message_preview, last_message_direction,
            unread_count, created_at, updated_at
        ) VALUES (
            v_conversation_id,
            v_dr_carlos_id,
            '+5511' || (70000000 + floor(random() * 9999999))::text,
            v_first_names[1 + floor(random() * 15)::int] || ' ' || v_last_names[1 + floor(random() * 15)::int],
            -- Usando whatsapp_conversation_status: 'open', 'pending', 'resolved', 'spam'
            (ARRAY['open', 'pending', 'resolved'])[1 + floor(random() * 3)::int]::whatsapp_conversation_status,
            v_random_date + (floor(random() * 5) || ' days')::interval,
            (ARRAY['Olá, gostaria de saber sobre os procedimentos', 'Qual o valor da harmonização?', 'Vocês têm horário amanhã?', 'Obrigada, confirmo meu agendamento!', 'Posso pagar parcelado?'])[1 + floor(random() * 5)::int],
            CASE WHEN random() > 0.5 THEN 'inbound' ELSE 'outbound' END,
            floor(random() * 5)::int,
            v_random_date,
            v_random_date + interval '1 day'
        );
        
        -- Criar algumas mensagens para cada conversa
        FOR v_j IN 1..floor(3 + random() * 7)::int LOOP
            INSERT INTO public.whatsapp_messages (
                user_id, conversation_id, phone_number, content, direction,
                message_type, status, sent_at, created_at
            ) 
            SELECT 
                v_dr_carlos_id,
                v_conversation_id,
                wc.phone_number,
                CASE WHEN random() > 0.5 
                    THEN (ARRAY['Olá! Como posso ajudar?', 'Temos vários procedimentos disponíveis.', 'O valor é de R$ ' || (500 + floor(random() * 2000))::text, 'Temos horário disponível sim!', 'Perfeito, agendamento confirmado!'])[1 + floor(random() * 5)::int]
                    ELSE (ARRAY['Oi, gostaria de informações', 'Quanto custa o procedimento?', 'Vocês trabalham aos sábados?', 'Posso agendar para semana que vem?', 'Obrigado!'])[1 + floor(random() * 5)::int]
                END,
                CASE WHEN random() > 0.5 THEN 'outbound' ELSE 'inbound' END,
                'text',
                'delivered',
                v_random_date + (v_j || ' hours')::interval,
                v_random_date + (v_j || ' hours')::interval
            FROM public.whatsapp_conversations wc
            WHERE wc.id = v_conversation_id;
        END LOOP;
    END LOOP;
    
    RAISE NOTICE '✅ Conversas WhatsApp criadas!';
    
    -- =====================================================
    -- 8. CRIAR RELATÓRIOS DE PROSPECÇÃO (últimos 15 dias)
    -- =====================================================
    FOR v_i IN 0..14 LOOP
        INSERT INTO public.prospecting_daily_reports (
            user_id, report_date, calls_made, contacts_reached,
            appointments_set, deals_closed, revenue, created_at
        ) VALUES (
            v_dr_carlos_id,
            (NOW() - (v_i || ' days')::interval)::date,
            floor(10 + random() * 40)::int,
            floor(5 + random() * 20)::int,
            floor(random() * 5)::int,
            floor(random() * 3)::int,
            floor(random() * 5000),
            NOW() - (v_i || ' days')::interval
        )
        ON CONFLICT (user_id, report_date) DO NOTHING;
    END LOOP;
    
    RAISE NOTICE '✅ Relatórios de prospecção criados!';
    
    -- =====================================================
    -- 9. CRIAR PROCEDIMENTOS COMERCIAIS
    -- =====================================================
    INSERT INTO public.commercial_procedures (user_id, name, category, description, price, duration_minutes, is_active)
    VALUES 
        (v_dr_carlos_id, 'Botox', 'procedure', 'Aplicação de toxina botulínica', 1200, 30, true),
        (v_dr_carlos_id, 'Preenchimento Labial', 'procedure', 'Preenchimento com ácido hialurônico', 1500, 45, true),
        (v_dr_carlos_id, 'Harmonização Facial', 'procedure', 'Harmonização completa do rosto', 3500, 90, true),
        (v_dr_carlos_id, 'Peeling Químico', 'procedure', 'Renovação da pele com ácidos', 450, 30, true),
        (v_dr_carlos_id, 'Consulta Inicial', 'consultation', 'Avaliação inicial do paciente', 200, 30, true),
        (v_dr_carlos_id, 'Retorno', 'consultation', 'Consulta de retorno', 0, 20, true),
        (v_dr_carlos_id, 'Laser Facial', 'procedure', 'Tratamento a laser para manchas', 800, 45, true)
    ON CONFLICT DO NOTHING;
    
    RAISE NOTICE '✅ Procedimentos comerciais criados!';
    
    -- =====================================================
    -- 10. CRIAR CONFIGURAÇÃO DE IA
    -- =====================================================
    INSERT INTO public.whatsapp_ai_config (user_id, auto_reply_enabled, knowledge_base, custom_prompt_instructions)
    VALUES (
        v_dr_carlos_id,
        false,
        'Clínica do Dr. Carlos, especialista em harmonização facial e procedimentos estéticos. Atendemos de segunda a sexta das 9h às 18h.',
        'Seja sempre simpático e profissional. Tente agendar uma avaliação inicial antes de passar valores.'
    )
    ON CONFLICT (user_id) DO NOTHING;
    
    RAISE NOTICE '✅ Configuração de IA criada!';
    
    -- =====================================================
    -- RESUMO FINAL
    -- =====================================================
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ DADOS GERADOS COM SUCESSO!';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Dr. Carlos agora tem:';
    RAISE NOTICE '- ~20 contatos';
    RAISE NOTICE '- ~15 deals';
    RAISE NOTICE '- ~12 agendamentos';
    RAISE NOTICE '- ~12 leads comerciais';
    RAISE NOTICE '- ~25 transações financeiras';
    RAISE NOTICE '- ~10 tarefas';
    RAISE NOTICE '- ~6 conversas WhatsApp';
    RAISE NOTICE '- 15 dias de relatórios de prospecção';
    RAISE NOTICE '- 7 procedimentos cadastrados';
    RAISE NOTICE '========================================';
    
END $$;

-- Verificar dados criados
SELECT 
    'Contatos' as tipo, COUNT(*) as quantidade 
FROM crm_contacts 
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'dr.carlos@dashmedpro.com')
UNION ALL
SELECT 'Deals', COUNT(*) FROM crm_deals WHERE user_id = (SELECT id FROM auth.users WHERE email = 'dr.carlos@dashmedpro.com')
UNION ALL
SELECT 'Agendamentos', COUNT(*) FROM medical_appointments WHERE user_id = (SELECT id FROM auth.users WHERE email = 'dr.carlos@dashmedpro.com')
UNION ALL
SELECT 'Leads', COUNT(*) FROM commercial_leads WHERE user_id = (SELECT id FROM auth.users WHERE email = 'dr.carlos@dashmedpro.com')
UNION ALL
SELECT 'Transações', COUNT(*) FROM financial_transactions WHERE user_id = (SELECT id FROM auth.users WHERE email = 'dr.carlos@dashmedpro.com')
UNION ALL
SELECT 'Tarefas', COUNT(*) FROM tasks WHERE user_id = (SELECT id FROM auth.users WHERE email = 'dr.carlos@dashmedpro.com')
UNION ALL
SELECT 'Conversas WA', COUNT(*) FROM whatsapp_conversations WHERE user_id = (SELECT id FROM auth.users WHERE email = 'dr.carlos@dashmedpro.com')
UNION ALL
SELECT 'Mensagens WA', COUNT(*) FROM whatsapp_messages WHERE user_id = (SELECT id FROM auth.users WHERE email = 'dr.carlos@dashmedpro.com');
