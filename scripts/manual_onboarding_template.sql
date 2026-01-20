-- PASSO A PASSO MANUAL PARA ADICIONAR NOVA CLÍNICA (SQL)

-- 1. Primeiro, crie a Organização
INSERT INTO public.organizations (name, slug, plan, status)
VALUES ('Imperius Tech', 'imperius', 'enterprise', 'active');

-- 2. Agora, você precisa dos IDs dos usuários.
-- O jeito mais fácil "manual" é:
--    a) Vá no Painel do Supabase -> Authentication -> Add User
--    b) Crie os usuários (dono, medico, secretaria) e defina a senha lá.
--    c) Copie o "User UID" de cada um.

-- 3. Com os IDs em mãos, rode isso para vincular eles à clínica:
-- (Substitua os UUIDs abaixo pelos reais que você copiou, e o slug se mudou)

WITH org AS (
    SELECT id FROM public.organizations WHERE slug = 'imperius' -- Nome da clínica criada no passo 1
)
INSERT INTO public.organization_members (organization_id, user_id, role)
VALUES 
    ((SELECT id FROM org), 'UUID_DO_DONO_AQUI', 'dono'),
    ((SELECT id FROM org), 'UUID_DO_MEDICO_AQUI', 'medico'),
    ((SELECT id FROM org), 'UUID_DA_SECRETARIA_AQUI', 'secretaria');

-- 4. (Opcional) Garantir que o Profile também está atualizado com o contexto atual
-- (Isso geralmente é automático se tiver triggers, mas via SQL direto fazemos assim)
UPDATE public.profiles SET organization_id = (SELECT id FROM public.organizations WHERE slug = 'imperius')
WHERE id IN ('UUID_DO_DONO_AQUI', 'UUID_DO_MEDICO_AQUI', 'UUID_DA_SECRETARIA_AQUI');
