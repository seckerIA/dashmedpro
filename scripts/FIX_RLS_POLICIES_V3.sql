-- ==============================================================================
-- SCRIPT AVANÇADO DE PERMISSÕES (RBAC) - DASHMED PRO
-- Data: 2026-01-05
-- Descrição: Implementa regras estritas de acesso baseadas nos requisitos:
-- 1. Admin/Donos: Acesso total (exceto prontuários alheios).
-- 2. Médicos: Acesso isolado aos seus dados.
-- 3. Secretária: Acesso amplo a Leads/Agendamentos, Financeiro restrito a Sinais.
-- ==============================================================================

-- 0. FUNÇÕES AUXILIARES OTIMIZADAS
-- ==============================================================================

-- Função para verificar se é Admin ou Dono (CACHEADA/STABLE para performance)
CREATE OR REPLACE FUNCTION public.is_admin_or_dono(_user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.user_roles 
    WHERE user_id = _user_id 
    AND role IN ('admin', 'dono')
  ) OR EXISTS (
    SELECT 1 
    FROM public.profiles 
    WHERE id = _user_id 
    AND role IN ('admin', 'dono')
  );
$$;

-- Função para verificar se é Secretária
CREATE OR REPLACE FUNCTION public.is_secretary(_user_id uuid)
RETURNS boolean
LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = 'secretaria'
  ) OR EXISTS (
    SELECT 1 FROM public.profiles WHERE id = _user_id AND role = 'secretaria'
  );
$$;

-- Função para verificar se é Médico
CREATE OR REPLACE FUNCTION public.is_doctor(_user_id uuid)
RETURNS boolean
LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = 'medico'
  ) OR EXISTS (
    SELECT 1 FROM public.profiles WHERE id = _user_id AND role = 'medico'
  );
$$;

-- ==============================================================================
-- 1. MEDICAL RECORDS (PRONTUÁRIOS) - BLINDAGEM TOTAL
-- "Não pode ver nenhum prontuario de medico" (Refere-se a outros médicos/donos lendo prontuário alheio)
-- ==============================================================================
-- Assumindo que a tabela se chama medical_records (se não existir, o comando falha mas ajustamos)
-- Se não existir, criamos uma dummy para garantir que a lógica esteja pronta

CREATE TABLE IF NOT EXISTS public.medical_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID REFERENCES public.crm_contacts(id),
    doctor_id UUID REFERENCES auth.users(id),
    content TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.medical_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Medical Records Strict Access" ON public.medical_records;

-- REGRA: Apenas o médico que criou pode ver/editar. NINGUÉM MAIS (nem Admin).
CREATE POLICY "Medical Records Strict Access" ON public.medical_records
FOR ALL USING (
    auth.uid() = doctor_id
    -- NENHUMA cláusula OR is_admin_or_dono
);

-- ==============================================================================
-- 2. FINANCEIRO - REGRAS ESPECÍFICAS
-- Donos: Tudo. Médicos: Apenas deles. Secretária: Apenas Sinais.
-- ==============================================================================

DROP POLICY IF EXISTS "financial_transactions_select" ON public.financial_transactions;
DROP POLICY IF EXISTS "financial_transactions_full_access" ON public.financial_transactions;

CREATE POLICY "financial_transactions_select_strict" ON public.financial_transactions
FOR SELECT USING (
    -- 1. O próprio dono do registro (Médico vendo o seu, Dono vendo o seu)
    auth.uid() = user_id 
    OR 
    -- 2. Admin/Dono vendo TUDO
    is_admin_or_dono(auth.uid())
    OR
    -- 3. Secretária vendo APENAS transações do tipo "SINAL" (Assumindo categoria 'Sinal' ou descrição)
    (
       is_secretary(auth.uid()) 
       AND (
           description ILIKE '%Sinal%' 
           OR 
           EXISTS (SELECT 1 FROM public.financial_categories fc WHERE fc.id = category_id AND fc.name ILIKE '%Sinal%')
       )
    )
);

-- Insert/Update/Delete para Financeiro
-- Secretária geralmente não deleta financeiro, talvez insira Sinais.
CREATE POLICY "financial_transactions_write_strict" ON public.financial_transactions
FOR INSERT WITH CHECK (
    auth.uid() = user_id -- Médico/Secretária inserindo pra si
    OR is_admin_or_dono(auth.uid()) -- Admin para outros
    OR (
        is_secretary(auth.uid()) 
        AND (description ILIKE '%Sinal%' OR EXISTS (SELECT 1 FROM public.financial_categories fc WHERE fc.id = category_id AND fc.name ILIKE '%Sinal%'))
        -- Permitir secretária lançar sinal para médicos
    )
);

-- ==============================================================================
-- 3. CRM LEADS & PACIENTES (crm_contacts)
-- Secretária: Vê TUDO (para agendar). Médicos: Vê SEUS. Admins: Tudo.
-- ==============================================================================
DROP POLICY IF EXISTS "crm_contacts_select" ON public.crm_contacts;

CREATE POLICY "crm_contacts_select_rbac" ON public.crm_contacts
FOR SELECT USING (
    -- Dono do registro
    auth.uid() = user_id 
    -- OU Admin/Dono
    OR is_admin_or_dono(auth.uid())
    -- OU Secretária (Vê tudo para poder agendar)
    OR is_secretary(auth.uid())
);

-- ==============================================================================
-- 4. PROCEDIMENTOS & CAMPANHAS
-- Secretária precisa ver procedimentos de todos para agendar.
-- ==============================================================================
DROP POLICY IF EXISTS "commercial_procedures_select" ON public.commercial_procedures;
-- Se não tinha policy antes, agora terá.

ALTER TABLE public.commercial_procedures ENABLE ROW LEVEL SECURITY;

CREATE POLICY "commercial_procedures_select_rbac" ON public.commercial_procedures
FOR SELECT USING (
    -- Dono do procedimento
    user_id = auth.uid()
    -- Admin vê tudo
    OR is_admin_or_dono(auth.uid())
    -- Secretária vê tudo para ofertar
    OR is_secretary(auth.uid())
    -- Médicos veem apenas os seus (Já coberto pela primeira cláusula se user_id for o criador)
);

-- ==============================================================================
-- 5. TAREFAS (Tasks)
-- "Atribuir tarefas para medico/secretaria"
-- "Dr Carlos... Tasks dadas pelo dono... mensagem ATRIBUIDA"
-- ==============================================================================

-- Trigger para adicionar [ATRIBUÍDA] no título
CREATE OR REPLACE FUNCTION public.handle_task_assignment()
RETURNS TRIGGER AS $$
BEGIN
    -- Se quem está criando (auth.uid()) é diferente de quem vai receber (assigned_to)
    -- E quem está criando é Admin/Dono
    IF NEW.assigned_to IS NOT NULL 
       AND NEW.assigned_to != auth.uid() 
       AND is_admin_or_dono(auth.uid()) THEN
       
       -- Adiciona prefixo se não tiver
       IF NEW.title NOT ILIKE '[ATRIBUÍDA]%' THEN
           NEW.title = '[ATRIBUÍDA] ' || NEW.title;
       END IF;
       
       -- Configura created_by corretamente
       NEW.created_by = auth.uid();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_task_assignment ON public.tasks;
CREATE TRIGGER on_task_assignment
BEFORE INSERT ON public.tasks
FOR EACH ROW EXECUTE FUNCTION public.handle_task_assignment();

-- RLS para Tasks
DROP POLICY IF EXISTS "tasks_select" ON public.tasks;

CREATE POLICY "tasks_select_rbac" ON public.tasks
FOR SELECT USING (
    -- Vê suas próprias (criadas ou atribuídas)
    auth.uid() = user_id 
    OR auth.uid() = assigned_to
    -- Admin vê tudo
    OR is_admin_or_dono(auth.uid())
);

-- ==============================================================================
-- 6. CALENDÁRIO (Medical Appointments)
-- Secretária: Vê de todos. Médico: Vê o seu.
-- ==============================================================================
DROP POLICY IF EXISTS "medical_appointments_select" ON public.medical_appointments;

CREATE POLICY "medical_appointments_select_rbac" ON public.medical_appointments
FOR SELECT USING (
    -- O próprio médico ou paciente (usuário do sistema)
    auth.uid() = user_id
    -- Admin
    OR is_admin_or_dono(auth.uid())
    -- Secretária (precisa ver agenda cheia)
    OR is_secretary(auth.uid())
);

-- ==============================================================================
-- 7. WHATSAPP & CONVERSAS
-- Isolar conversas.
-- "DEVE TER A OPÇÂO DE VER WHATSAPP DA SECRETARIA" -> Admin pode ver conversas da Secretária
-- ==============================================================================
-- Tabela whatsapp_conversations

DROP POLICY IF EXISTS "whatsapp_conversations_select" ON public.whatsapp_conversations;

CREATE POLICY "whatsapp_conversations_select_rbac" ON public.whatsapp_conversations
FOR SELECT USING (
    -- Dono da conversa (Médico/Secretária vendo suas conversas)
    -- A tabela deve ter user_id ou similar vinculando ao responsável
    -- Assumindo 'user_id' é o dono da sessão/instância
    
    -- Caso 1: Minhas conversas
    auth.uid() = user_id -- (verifique se user_id na tabela conversa é o dono da conta whatsaap ou o atendente)
    
    -- Caso 2: Admin vendo conversas da Secretária ou de qualquer um
    OR is_admin_or_dono(auth.uid())
    
    -- Caso 3: Médico vendo conversas da Secretária (Se permitido)
    -- (Lógica: Se a conversa pertence a uma Secretária, o Médico pode ver?)
    -- Implementação futura se necessário vínculo explícito
);

-- Mensagem final
-- SELECT 'Permissões RBAC aplicadas com sucesso' as status;
