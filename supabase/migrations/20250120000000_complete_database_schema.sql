-- =====================================================
-- MIGRAÇÃO COMPLETA DO BANCO DE DADOS - DashMed Pro
-- =====================================================
-- Este script cria todas as estruturas necessárias para o projeto
-- Ordem: Enums -> Funções -> Tabelas -> Índices -> Triggers -> RLS -> Storage
-- =====================================================

-- =====================================================
-- PARTE 1: ENUMS
-- =====================================================

-- User roles
DO $$ BEGIN
    CREATE TYPE public.user_role AS ENUM ('admin', 'dono', 'vendedor', 'gestor_trafego');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- CRM Pipeline Stages
DO $$ BEGIN
    CREATE TYPE public.crm_pipeline_stage AS ENUM (
        'lead_novo',
        'qualificado',
        'apresentacao',
        'proposta',
        'negociacao',
        'fechado_ganho',
        'fechado_perdido'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- CRM Activity Types
DO $$ BEGIN
    CREATE TYPE public.crm_activity_type AS ENUM (
        'call',
        'email',
        'whatsapp',
        'meeting',
        'note',
        'task',
        'ai_interaction'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Task Categories
DO $$ BEGIN
    CREATE TYPE public.task_category AS ENUM (
        'comercial',
        'marketing',
        'financeiro',
        'social_media',
        'empresarial'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Task Status
DO $$ BEGIN
    CREATE TYPE public.task_status AS ENUM (
        'pendente',
        'em_andamento',
        'concluida',
        'cancelada'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Task Priority
DO $$ BEGIN
    CREATE TYPE public.task_priority AS ENUM (
        'baixa',
        'media',
        'alta',
        'urgente'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Appointment Types
DO $$ BEGIN
    CREATE TYPE public.appointment_type AS ENUM (
        'first_visit',
        'return',
        'procedure',
        'urgent',
        'follow_up',
        'exam'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Appointment Status
DO $$ BEGIN
    CREATE TYPE public.appointment_status AS ENUM (
        'scheduled',
        'confirmed',
        'in_progress',
        'completed',
        'cancelled',
        'no_show'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Payment Status
DO $$ BEGIN
    CREATE TYPE public.payment_status AS ENUM (
        'pending',
        'paid',
        'partial',
        'cancelled'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Meeting Types
DO $$ BEGIN
    CREATE TYPE public.meeting_type AS ENUM (
        'meeting',
        'appointment',
        'block',
        'other'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Meeting Status
DO $$ BEGIN
    CREATE TYPE public.meeting_status AS ENUM (
        'scheduled',
        'completed',
        'cancelled'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Sales Call Status
DO $$ BEGIN
    CREATE TYPE public.sales_call_status AS ENUM (
        'scheduled',
        'completed',
        'cancelled',
        'no_show'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Session Result
DO $$ BEGIN
    CREATE TYPE public.session_result AS ENUM (
        'atendimento_encerrado',
        'contato_decisor',
        'sem_resposta',
        'rejeitado'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Commercial Lead Status
DO $$ BEGIN
    CREATE TYPE public.commercial_lead_status AS ENUM (
        'new',
        'contacted',
        'qualified',
        'converted',
        'lost'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Commercial Lead Origin
DO $$ BEGIN
    CREATE TYPE public.commercial_lead_origin AS ENUM (
        'google',
        'instagram',
        'facebook',
        'indication',
        'website',
        'other'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Commercial Procedure Category
DO $$ BEGIN
    CREATE TYPE public.commercial_procedure_category AS ENUM (
        'consultation',
        'procedure',
        'exam',
        'surgery',
        'other'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Commercial Sale Status
DO $$ BEGIN
    CREATE TYPE public.commercial_sale_status AS ENUM (
        'quote',
        'confirmed',
        'completed',
        'cancelled'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Commercial Payment Method
DO $$ BEGIN
    CREATE TYPE public.commercial_payment_method AS ENUM (
        'cash',
        'credit_card',
        'debit_card',
        'pix',
        'bank_transfer',
        'installment'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Commercial Campaign Type
DO $$ BEGIN
    CREATE TYPE public.commercial_campaign_type AS ENUM (
        'first_consultation_discount',
        'procedure_package',
        'seasonal_promotion',
        'referral_benefit'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Commercial Interaction Type
DO $$ BEGIN
    CREATE TYPE public.commercial_interaction_type AS ENUM (
        'call',
        'email',
        'whatsapp',
        'meeting',
        'other'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Account Type
DO $$ BEGIN
    CREATE TYPE public.account_type AS ENUM (
        'conta_corrente',
        'poupanca',
        'caixa',
        'investimento'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Transaction Type
DO $$ BEGIN
    CREATE TYPE public.transaction_type AS ENUM (
        'entrada',
        'saida'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Category Type
DO $$ BEGIN
    CREATE TYPE public.category_type AS ENUM (
        'entrada',
        'saida'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Payment Method
DO $$ BEGIN
    CREATE TYPE public.payment_method AS ENUM (
        'dinheiro',
        'pix',
        'cartao_credito',
        'cartao_debito',
        'boleto',
        'transferencia',
        'cheque'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Transaction Status
DO $$ BEGIN
    CREATE TYPE public.transaction_status AS ENUM (
        'pendente',
        'concluida',
        'cancelada'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Recurrence Frequency
DO $$ BEGIN
    CREATE TYPE public.recurrence_frequency AS ENUM (
        'diaria',
        'semanal',
        'quinzenal',
        'mensal',
        'bimestral',
        'trimestral',
        'semestral',
        'anual'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Budget Status
DO $$ BEGIN
    CREATE TYPE public.budget_status AS ENUM (
        'active',
        'exceeded',
        'completed',
        'cancelled'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Cost Type
DO $$ BEGIN
    CREATE TYPE public.cost_type AS ENUM (
        'ferramentas',
        'operacional',
        'terceirizacao'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- =====================================================
-- PARTE 2: FUNÇÕES BASE (SEM DEPENDÊNCIAS DE TABELAS)
-- =====================================================

-- Função genérica para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- Função para calcular end_time de appointment baseado em duration_minutes
CREATE OR REPLACE FUNCTION public.calculate_appointment_end_time()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NEW.duration_minutes IS NOT NULL AND NEW.start_time IS NOT NULL THEN
        NEW.end_time = NEW.start_time + (NEW.duration_minutes || ' minutes')::INTERVAL;
    END IF;
    RETURN NEW;
END;
$$;

-- Função para atualizar updated_at de medical_appointments
CREATE OR REPLACE FUNCTION public.update_medical_appointments_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$;

-- Função para atualizar updated_at de general_meetings
CREATE OR REPLACE FUNCTION public.update_general_meetings_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$;

-- Função para atualizar custos de transação
CREATE OR REPLACE FUNCTION public.update_transaction_costs()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_transaction_id UUID;
BEGIN
    IF TG_OP = 'DELETE' THEN
        v_transaction_id := OLD.transaction_id;
    ELSE
        v_transaction_id := NEW.transaction_id;
    END IF;

    UPDATE financial_transactions
    SET 
        total_costs = COALESCE((
            SELECT SUM(amount)
            FROM transaction_costs
            WHERE transaction_id = v_transaction_id
        ), 0),
        has_costs = EXISTS(
            SELECT 1 FROM transaction_costs WHERE transaction_id = v_transaction_id
        ),
        updated_at = NOW()
    WHERE id = v_transaction_id;

    RETURN COALESCE(NEW, OLD);
END;
$$;

-- =====================================================
-- PARTE 2.1: FUNÇÕES QUE DEPENDEM DE TABELAS (CRIADAS APÓS AS TABELAS)
-- =====================================================
-- Estas funções serão criadas após a criação da tabela profiles
-- Ver PARTE 18 no final do script

-- =====================================================
-- PARTE 3: TABELAS BASE
-- =====================================================

-- Tabela profiles
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT,
    role user_role NOT NULL DEFAULT 'vendedor',
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    invited_by UUID REFERENCES auth.users(id),
    is_active BOOLEAN DEFAULT true
);

COMMENT ON TABLE public.profiles IS 'Perfis de usuários com roles e informações básicas';
COMMENT ON COLUMN public.profiles.role IS 'Role do usuário: admin, dono, vendedor, gestor_trafego';

-- Tabela team_invitations
CREATE TABLE IF NOT EXISTS public.team_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL,
    role user_role NOT NULL,
    invited_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    invitation_token UUID DEFAULT gen_random_uuid(),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days'),
    accepted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(email, accepted_at)
);

COMMENT ON TABLE public.team_invitations IS 'Convites para adicionar membros à equipe';

-- =====================================================
-- PARTE 2.1: FUNÇÕES QUE DEPENDEM DE TABELAS (CRIADAS APÓS profiles)
-- =====================================================
-- Estas funções precisam ser criadas após a tabela profiles existir
-- mas antes das políticas RLS que as utilizam

-- Função para obter role do usuário
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS user_role
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT role FROM public.profiles WHERE id = _user_id;
$$;

-- Função para verificar se usuário tem role específica
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role user_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = _user_id AND role = _role AND is_active = true
    );
$$;

-- Função para verificar se é admin ou dono
CREATE OR REPLACE FUNCTION public.is_admin_or_dono(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = _user_id AND role IN ('admin', 'dono') AND is_active = true
    );
$$;

-- Função para criar perfil ao criar usuário
CREATE OR REPLACE FUNCTION public.handle_new_user_from_invitation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    invitation_record team_invitations%ROWTYPE;
BEGIN
    SELECT * INTO invitation_record
    FROM public.team_invitations
    WHERE email = NEW.email 
        AND accepted_at IS NULL 
        AND expires_at > NOW()
    ORDER BY created_at DESC
    LIMIT 1;

    IF invitation_record.id IS NOT NULL THEN
        INSERT INTO public.profiles (id, email, role, invited_by, full_name)
        VALUES (
            NEW.id, 
            NEW.email, 
            invitation_record.role, 
            invitation_record.invited_by,
            COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1))
        );
        
        UPDATE public.team_invitations 
        SET accepted_at = NOW() 
        WHERE id = invitation_record.id;
    ELSE
        INSERT INTO public.profiles (id, email, role, full_name)
        VALUES (
            NEW.id, 
            NEW.email, 
            'vendedor'::user_role,
            COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1))
        );
    END IF;
    
    RETURN NEW;
END;
$$;

-- Trigger para criar perfil ao criar usuário
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_from_invitation();

-- =====================================================
-- PARTE 4: TABELAS CRM
-- =====================================================

-- Tabela crm_contacts
CREATE TABLE IF NOT EXISTS public.crm_contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    company TEXT,
    position TEXT,
    lead_score INTEGER DEFAULT 0,
    tags TEXT[] DEFAULT '{}',
    custom_fields JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_contact_at TIMESTAMPTZ
);

COMMENT ON TABLE public.crm_contacts IS 'Contatos do CRM';

-- Tabela crm_deals
CREATE TABLE IF NOT EXISTS public.crm_deals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    contact_id UUID REFERENCES public.crm_contacts(id) ON DELETE CASCADE,
    assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT,
    value DECIMAL(10, 2),
    stage crm_pipeline_stage NOT NULL DEFAULT 'lead_novo',
    probability INTEGER DEFAULT 0 CHECK (probability >= 0 AND probability <= 100),
    expected_close_date TIMESTAMPTZ,
    closed_at TIMESTAMPTZ,
    position INTEGER DEFAULT 0,
    tags TEXT[] DEFAULT '{}',
    custom_fields JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.crm_deals IS 'Negócios e oportunidades do CRM';
COMMENT ON COLUMN public.crm_deals.stage IS 'Estágio do pipeline: lead_novo, qualificado, apresentacao, proposta, negociacao, fechado_ganho, fechado_perdido';

-- Tabela crm_activities
CREATE TABLE IF NOT EXISTS public.crm_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    contact_id UUID REFERENCES public.crm_contacts(id) ON DELETE CASCADE,
    deal_id UUID REFERENCES public.crm_deals(id) ON DELETE CASCADE,
    activity_type crm_activity_type NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    completed BOOLEAN DEFAULT false,
    scheduled_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.crm_activities IS 'Atividades do CRM (ligações, emails, reuniões, etc.)';
COMMENT ON COLUMN public.crm_activities.activity_type IS 'Tipo de atividade: call, email, whatsapp, meeting, note, task, ai_interaction';

-- Tabela crm_follow_ups
CREATE TABLE IF NOT EXISTS public.crm_follow_ups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    deal_id UUID REFERENCES public.crm_deals(id) ON DELETE CASCADE,
    contact_id UUID REFERENCES public.crm_contacts(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    type TEXT NOT NULL DEFAULT 'call',
    scheduled_date TIMESTAMPTZ NOT NULL,
    notes TEXT,
    completed BOOLEAN DEFAULT false,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE public.crm_follow_ups IS 'Follow-ups de negócios e contatos';

-- =====================================================
-- PARTE 5: TABELAS DE TAREFAS
-- =====================================================

-- Tabela tasks
CREATE TABLE IF NOT EXISTS public.tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT,
    status task_status DEFAULT 'pendente',
    priority task_priority DEFAULT 'media',
    category task_category,
    due_date DATE,
    completed_at TIMESTAMPTZ,
    deal_id UUID REFERENCES public.crm_deals(id) ON DELETE SET NULL,
    contact_id UUID REFERENCES public.crm_contacts(id) ON DELETE SET NULL,
    assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    image_url TEXT,
    position INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE public.tasks IS 'Tarefas do sistema';
COMMENT ON COLUMN public.tasks.status IS 'Status: pendente, em_andamento, concluida, cancelada';
COMMENT ON COLUMN public.tasks.priority IS 'Prioridade: baixa, media, alta, urgente';
COMMENT ON COLUMN public.tasks.category IS 'Categoria: comercial, marketing, financeiro, social_media, empresarial';

-- =====================================================
-- PARTE 6: TABELAS FINANCEIRAS
-- =====================================================

-- Tabela financial_accounts
CREATE TABLE IF NOT EXISTS public.financial_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    type account_type DEFAULT 'conta_corrente',
    bank_name TEXT,
    account_number TEXT,
    initial_balance DECIMAL(15,2) DEFAULT 0,
    current_balance DECIMAL(15,2) DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE public.financial_accounts IS 'Contas financeiras (contas correntes, poupanças, etc.)';
COMMENT ON COLUMN public.financial_accounts.type IS 'Tipo: conta_corrente, poupanca, caixa, investimento';

-- Tabela financial_categories
CREATE TABLE IF NOT EXISTS public.financial_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    type category_type NOT NULL,
    color TEXT,
    icon TEXT,
    parent_id UUID REFERENCES public.financial_categories(id) ON DELETE SET NULL,
    is_system BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE public.financial_categories IS 'Categorias financeiras (entrada/saída)';
COMMENT ON COLUMN public.financial_categories.type IS 'Tipo: entrada ou saida';
COMMENT ON COLUMN public.financial_categories.is_system IS 'Se true, categoria do sistema (não pode ser deletada)';

-- Tabela financial_transactions
CREATE TABLE IF NOT EXISTS public.financial_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    account_id UUID REFERENCES public.financial_accounts(id) ON DELETE SET NULL,
    category_id UUID REFERENCES public.financial_categories(id) ON DELETE SET NULL,
    type transaction_type NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    description TEXT,
    date DATE NOT NULL,
    transaction_date DATE,
    payment_method payment_method,
    deal_id UUID REFERENCES public.crm_deals(id) ON DELETE SET NULL,
    tags TEXT[] DEFAULT '{}',
    notes TEXT,
    contact_id UUID REFERENCES public.crm_contacts(id) ON DELETE SET NULL,
    status transaction_status DEFAULT 'pendente',
    is_recurring BOOLEAN DEFAULT false,
    recurrence_id UUID,
    has_costs BOOLEAN DEFAULT false,
    total_costs DECIMAL(15,2) DEFAULT 0,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE public.financial_transactions IS 'Transações financeiras (entradas e saídas)';
COMMENT ON COLUMN public.financial_transactions.type IS 'Tipo: entrada ou saida';
COMMENT ON COLUMN public.financial_transactions.status IS 'Status: pendente, concluida, cancelada';
COMMENT ON COLUMN public.financial_transactions.has_costs IS 'Indica se a transação possui custos associados';
COMMENT ON COLUMN public.financial_transactions.total_costs IS 'Soma total de todos os custos associados';

-- Tabela financial_attachments
CREATE TABLE IF NOT EXISTS public.financial_attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id UUID REFERENCES public.financial_transactions(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_type TEXT,
    file_size INTEGER,
    created_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE public.financial_attachments IS 'Anexos de transações financeiras';

-- Tabela financial_recurring_transactions
CREATE TABLE IF NOT EXISTS public.financial_recurring_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    template_transaction_id UUID REFERENCES public.financial_transactions(id) ON DELETE CASCADE,
    frequency recurrence_frequency NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE,
    next_occurrence DATE NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE public.financial_recurring_transactions IS 'Transações recorrentes';
COMMENT ON COLUMN public.financial_recurring_transactions.frequency IS 'Frequência: diaria, semanal, quinzenal, mensal, bimestral, trimestral, semestral, anual';

-- Tabela financial_budgets
CREATE TABLE IF NOT EXISTS public.financial_budgets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    category_id UUID REFERENCES public.financial_categories(id) ON DELETE CASCADE,
    amount DECIMAL(15,2) NOT NULL,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    status budget_status DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE public.financial_budgets IS 'Orçamentos financeiros por categoria';
COMMENT ON COLUMN public.financial_budgets.status IS 'Status: active, exceeded, completed, cancelled';

-- Tabela transaction_costs
CREATE TABLE IF NOT EXISTS public.transaction_costs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id UUID NOT NULL REFERENCES public.financial_transactions(id) ON DELETE CASCADE,
    cost_type cost_type NOT NULL,
    amount DECIMAL(15,2) NOT NULL CHECK (amount >= 0),
    description TEXT,
    attachment_id UUID REFERENCES public.financial_attachments(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.transaction_costs IS 'Custos associados a transações de prestação de serviços';
COMMENT ON COLUMN public.transaction_costs.cost_type IS 'Tipo de custo: ferramentas, operacional, terceirizacao';

-- =====================================================
-- PARTE 7: TABELAS MÉDICAS
-- =====================================================

-- Tabela medical_appointments
CREATE TABLE IF NOT EXISTS public.medical_appointments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    contact_id UUID NOT NULL REFERENCES public.crm_contacts(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    appointment_type appointment_type NOT NULL DEFAULT 'first_visit',
    status appointment_status NOT NULL DEFAULT 'scheduled',
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    duration_minutes INTEGER NOT NULL DEFAULT 30 CHECK (duration_minutes > 0 AND duration_minutes <= 480),
    notes TEXT,
    internal_notes TEXT,
    estimated_value DECIMAL(10,2),
    payment_status payment_status DEFAULT 'pending',
    financial_transaction_id UUID REFERENCES public.financial_transactions(id) ON DELETE SET NULL,
    completed_at TIMESTAMP WITH TIME ZONE,
    cancelled_at TIMESTAMP WITH TIME ZONE,
    cancellation_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT valid_time_range CHECK (end_time > start_time)
);

COMMENT ON TABLE public.medical_appointments IS 'Agendamentos médicos com integração financeira';
COMMENT ON COLUMN public.medical_appointments.appointment_type IS 'Tipo: first_visit, return, procedure, urgent, follow_up, exam';
COMMENT ON COLUMN public.medical_appointments.status IS 'Status: scheduled, confirmed, in_progress, completed, cancelled, no_show';
COMMENT ON COLUMN public.medical_appointments.payment_status IS 'Status do pagamento: pending, paid, partial, cancelled';
COMMENT ON COLUMN public.medical_appointments.internal_notes IS 'Notas privadas para equipe, não visíveis para pacientes';

-- =====================================================
-- PARTE 8: TABELAS DE REUNIÕES
-- =====================================================

-- Tabela general_meetings
CREATE TABLE IF NOT EXISTS public.general_meetings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    duration_minutes INTEGER NOT NULL DEFAULT 30 CHECK (duration_minutes > 0 AND duration_minutes <= 480),
    location TEXT,
    meeting_type meeting_type NOT NULL DEFAULT 'meeting',
    is_busy BOOLEAN NOT NULL DEFAULT true,
    attendees TEXT[],
    notes TEXT,
    status meeting_status NOT NULL DEFAULT 'scheduled',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT valid_time_range CHECK (end_time > start_time)
);

COMMENT ON TABLE public.general_meetings IS 'Reuniões e compromissos gerais do médico';
COMMENT ON COLUMN public.general_meetings.is_busy IS 'Se true, marca o período como indisponível para agendamento de consultas médicas';
COMMENT ON COLUMN public.general_meetings.meeting_type IS 'Tipo: meeting, appointment, block, other';

-- =====================================================
-- PARTE 9: TABELAS COMERCIAIS
-- =====================================================

-- Tabela commercial_leads
CREATE TABLE IF NOT EXISTS public.commercial_leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    origin commercial_lead_origin NOT NULL DEFAULT 'other',
    status commercial_lead_status NOT NULL DEFAULT 'new',
    estimated_value DECIMAL(10, 2),
    converted_at TIMESTAMPTZ,
    contact_id UUID REFERENCES public.crm_contacts(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.commercial_leads IS 'Leads comerciais';
COMMENT ON COLUMN public.commercial_leads.origin IS 'Origem: google, instagram, facebook, indication, website, other';
COMMENT ON COLUMN public.commercial_leads.status IS 'Status: new, contacted, qualified, converted, lost';

-- Tabela commercial_procedures
CREATE TABLE IF NOT EXISTS public.commercial_procedures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    category commercial_procedure_category NOT NULL DEFAULT 'other',
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    duration_minutes INTEGER NOT NULL DEFAULT 30,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.commercial_procedures IS 'Catálogo de procedimentos comerciais';
COMMENT ON COLUMN public.commercial_procedures.category IS 'Categoria: consultation, procedure, exam, surgery, other';

-- Tabela commercial_sales
CREATE TABLE IF NOT EXISTS public.commercial_sales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    lead_id UUID REFERENCES public.commercial_leads(id) ON DELETE SET NULL,
    contact_id UUID REFERENCES public.crm_contacts(id) ON DELETE SET NULL,
    procedure_id UUID REFERENCES public.commercial_procedures(id) ON DELETE SET NULL,
    appointment_id UUID REFERENCES public.medical_appointments(id) ON DELETE SET NULL,
    value DECIMAL(10, 2) NOT NULL,
    status commercial_sale_status NOT NULL DEFAULT 'quote',
    payment_method commercial_payment_method,
    installments INTEGER DEFAULT 1,
    sale_date TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.commercial_sales IS 'Vendas comerciais';
COMMENT ON COLUMN public.commercial_sales.status IS 'Status: quote, confirmed, completed, cancelled';

-- Tabela commercial_campaigns
CREATE TABLE IF NOT EXISTS public.commercial_campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type commercial_campaign_type NOT NULL,
    discount_percentage DECIMAL(5, 2),
    discount_amount DECIMAL(10, 2),
    start_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ NOT NULL,
    target_audience TEXT,
    promo_code TEXT UNIQUE,
    leads_generated INTEGER DEFAULT 0,
    conversions INTEGER DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.commercial_campaigns IS 'Campanhas comerciais e promoções';
COMMENT ON COLUMN public.commercial_campaigns.type IS 'Tipo: first_consultation_discount, procedure_package, seasonal_promotion, referral_benefit';

-- Tabela commercial_lead_interactions
CREATE TABLE IF NOT EXISTS public.commercial_lead_interactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID NOT NULL REFERENCES public.commercial_leads(id) ON DELETE CASCADE,
    interaction_type commercial_interaction_type NOT NULL,
    notes TEXT,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.commercial_lead_interactions IS 'Interações com leads comerciais';
COMMENT ON COLUMN public.commercial_lead_interactions.interaction_type IS 'Tipo: call, email, whatsapp, meeting, other';

-- =====================================================
-- PARTE 10: TABELAS DE PROSPECÇÃO
-- =====================================================

-- Tabela prospecting_scripts
CREATE TABLE IF NOT EXISTS public.prospecting_scripts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    content TEXT,
    category TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE public.prospecting_scripts IS 'Scripts de prospecção';

-- Tabela prospecting_sessions
CREATE TABLE IF NOT EXISTS public.prospecting_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    script_id UUID REFERENCES public.prospecting_scripts(id) ON DELETE SET NULL,
    contact_id UUID REFERENCES public.crm_contacts(id) ON DELETE SET NULL,
    started_at TIMESTAMPTZ DEFAULT now(),
    ended_at TIMESTAMPTZ,
    result session_result,
    created_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE public.prospecting_sessions IS 'Sessões de prospecção';
COMMENT ON COLUMN public.prospecting_sessions.result IS 'Resultado: atendimento_encerrado, contato_decisor, sem_resposta, rejeitado';

-- Tabela prospecting_daily_reports
CREATE TABLE IF NOT EXISTS public.prospecting_daily_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    report_date DATE NOT NULL,
    calls_made INTEGER DEFAULT 0,
    contacts_reached INTEGER DEFAULT 0,
    appointments_set INTEGER DEFAULT 0,
    deals_closed INTEGER DEFAULT 0,
    revenue DECIMAL(15,2) DEFAULT 0,
    notes TEXT,
    is_paused BOOLEAN DEFAULT false,
    paused_at TIMESTAMP WITH TIME ZONE,
    total_paused_time INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, report_date)
);

COMMENT ON TABLE public.prospecting_daily_reports IS 'Relatórios diários de prospecção';
COMMENT ON COLUMN public.prospecting_daily_reports.is_paused IS 'Indica se o cronômetro está pausado';
COMMENT ON COLUMN public.prospecting_daily_reports.total_paused_time IS 'Tempo total pausado em minutos (acumulado)';

-- =====================================================
-- PARTE 11: TABELAS DE VENDAS
-- =====================================================

-- Tabela sales_calls
CREATE TABLE IF NOT EXISTS public.sales_calls (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    contact_id UUID NOT NULL REFERENCES public.crm_contacts(id) ON DELETE CASCADE,
    deal_id UUID REFERENCES public.crm_deals(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
    duration_minutes INTEGER NOT NULL DEFAULT 30,
    status sales_call_status NOT NULL DEFAULT 'scheduled',
    notes TEXT,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

COMMENT ON TABLE public.sales_calls IS 'Chamadas de vendas agendadas';
COMMENT ON COLUMN public.sales_calls.status IS 'Status: scheduled, completed, cancelled, no_show';

-- =====================================================
-- PARTE 12: TABELAS DE CONFIGURAÇÃO
-- =====================================================

-- Tabela user_daily_goals
CREATE TABLE IF NOT EXISTS public.user_daily_goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    default_goal_calls INTEGER DEFAULT 50,
    default_goal_contacts INTEGER DEFAULT 20,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id)
);

COMMENT ON TABLE public.user_daily_goals IS 'Metas padrão diárias de cada usuário para prospecção';

-- Tabela notifications
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT DEFAULT 'info',
    title TEXT NOT NULL,
    message TEXT,
    read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE public.notifications IS 'Notificações do sistema para usuários';

-- =====================================================
-- PARTE 13: ÍNDICES PARA PERFORMANCE
-- =====================================================

-- Índices para profiles
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_is_active ON public.profiles(is_active);

-- Índices para crm_contacts
CREATE INDEX IF NOT EXISTS idx_crm_contacts_user_id ON public.crm_contacts(user_id);
CREATE INDEX IF NOT EXISTS idx_crm_contacts_email ON public.crm_contacts(email);
CREATE INDEX IF NOT EXISTS idx_crm_contacts_phone ON public.crm_contacts(phone);
CREATE INDEX IF NOT EXISTS idx_crm_contacts_full_name ON public.crm_contacts(full_name);

-- Índices para crm_deals
CREATE INDEX IF NOT EXISTS idx_crm_deals_user_id ON public.crm_deals(user_id);
CREATE INDEX IF NOT EXISTS idx_crm_deals_contact_id ON public.crm_deals(contact_id);
CREATE INDEX IF NOT EXISTS idx_crm_deals_assigned_to ON public.crm_deals(assigned_to);
CREATE INDEX IF NOT EXISTS idx_crm_deals_stage ON public.crm_deals(stage);
CREATE INDEX IF NOT EXISTS idx_crm_deals_position ON public.crm_deals(position);

-- Índices para crm_activities
CREATE INDEX IF NOT EXISTS idx_crm_activities_user_id ON public.crm_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_crm_activities_contact_id ON public.crm_activities(contact_id);
CREATE INDEX IF NOT EXISTS idx_crm_activities_deal_id ON public.crm_activities(deal_id);
CREATE INDEX IF NOT EXISTS idx_crm_activities_type ON public.crm_activities(activity_type);
CREATE INDEX IF NOT EXISTS idx_crm_activities_scheduled_at ON public.crm_activities(scheduled_at);

-- Índices para crm_follow_ups
CREATE INDEX IF NOT EXISTS idx_crm_follow_ups_deal_id ON public.crm_follow_ups(deal_id);
CREATE INDEX IF NOT EXISTS idx_crm_follow_ups_contact_id ON public.crm_follow_ups(contact_id);
CREATE INDEX IF NOT EXISTS idx_crm_follow_ups_user_id ON public.crm_follow_ups(user_id);
CREATE INDEX IF NOT EXISTS idx_crm_follow_ups_scheduled_date ON public.crm_follow_ups(scheduled_date);

-- Índices para tasks
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON public.tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_created_by ON public.tasks(created_by);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON public.tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON public.tasks(priority);
CREATE INDEX IF NOT EXISTS idx_tasks_category ON public.tasks(category);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON public.tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_deal_id ON public.tasks(deal_id);
CREATE INDEX IF NOT EXISTS idx_tasks_contact_id ON public.tasks(contact_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON public.tasks(assigned_to);

-- Índices para financial_accounts
CREATE INDEX IF NOT EXISTS idx_financial_accounts_user_id ON public.financial_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_financial_accounts_type ON public.financial_accounts(type);
CREATE INDEX IF NOT EXISTS idx_financial_accounts_is_active ON public.financial_accounts(is_active);

-- Índices para financial_categories
CREATE INDEX IF NOT EXISTS idx_financial_categories_type ON public.financial_categories(type);
CREATE INDEX IF NOT EXISTS idx_financial_categories_parent_id ON public.financial_categories(parent_id);

-- Índices para financial_transactions
CREATE INDEX IF NOT EXISTS idx_financial_transactions_user_id ON public.financial_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_account_id ON public.financial_transactions(account_id);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_category_id ON public.financial_transactions(category_id);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_type ON public.financial_transactions(type);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_date ON public.financial_transactions(date);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_transaction_date ON public.financial_transactions(transaction_date);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_status ON public.financial_transactions(status);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_deal_id ON public.financial_transactions(deal_id);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_contact_id ON public.financial_transactions(contact_id);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_has_costs ON public.financial_transactions(has_costs);

-- Índices para financial_attachments
CREATE INDEX IF NOT EXISTS idx_financial_attachments_transaction_id ON public.financial_attachments(transaction_id);

-- Índices para financial_recurring_transactions
CREATE INDEX IF NOT EXISTS idx_financial_recurring_user_id ON public.financial_recurring_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_financial_recurring_template_id ON public.financial_recurring_transactions(template_transaction_id);
CREATE INDEX IF NOT EXISTS idx_financial_recurring_next_occurrence ON public.financial_recurring_transactions(next_occurrence);
CREATE INDEX IF NOT EXISTS idx_financial_recurring_is_active ON public.financial_recurring_transactions(is_active);

-- Índices para financial_budgets
CREATE INDEX IF NOT EXISTS idx_financial_budgets_user_id ON public.financial_budgets(user_id);
CREATE INDEX IF NOT EXISTS idx_financial_budgets_category_id ON public.financial_budgets(category_id);
CREATE INDEX IF NOT EXISTS idx_financial_budgets_status ON public.financial_budgets(status);
CREATE INDEX IF NOT EXISTS idx_financial_budgets_period ON public.financial_budgets(period_start, period_end);

-- Índices para transaction_costs
CREATE INDEX IF NOT EXISTS idx_transaction_costs_transaction ON public.transaction_costs(transaction_id);
CREATE INDEX IF NOT EXISTS idx_transaction_costs_type ON public.transaction_costs(cost_type);

-- Índices para medical_appointments
CREATE INDEX IF NOT EXISTS idx_medical_appointments_user_id ON public.medical_appointments(user_id);
CREATE INDEX IF NOT EXISTS idx_medical_appointments_contact_id ON public.medical_appointments(contact_id);
CREATE INDEX IF NOT EXISTS idx_medical_appointments_start_time ON public.medical_appointments(start_time);
CREATE INDEX IF NOT EXISTS idx_medical_appointments_status ON public.medical_appointments(status);
CREATE INDEX IF NOT EXISTS idx_medical_appointments_appointment_type ON public.medical_appointments(appointment_type);
CREATE INDEX IF NOT EXISTS idx_medical_appointments_payment_status ON public.medical_appointments(payment_status);
CREATE INDEX IF NOT EXISTS idx_medical_appointments_financial_transaction_id ON public.medical_appointments(financial_transaction_id);
CREATE INDEX IF NOT EXISTS idx_medical_appointments_user_time ON public.medical_appointments(user_id, start_time, end_time);

-- Índices para general_meetings
CREATE INDEX IF NOT EXISTS idx_general_meetings_user_id ON public.general_meetings(user_id);
CREATE INDEX IF NOT EXISTS idx_general_meetings_start_time ON public.general_meetings(start_time);
CREATE INDEX IF NOT EXISTS idx_general_meetings_end_time ON public.general_meetings(end_time);
CREATE INDEX IF NOT EXISTS idx_general_meetings_status ON public.general_meetings(status);
CREATE INDEX IF NOT EXISTS idx_general_meetings_is_busy ON public.general_meetings(is_busy);
CREATE INDEX IF NOT EXISTS idx_general_meetings_user_time_range ON public.general_meetings(user_id, start_time, end_time);

-- Índices para commercial_leads
CREATE INDEX IF NOT EXISTS idx_commercial_leads_user_id ON public.commercial_leads(user_id);
CREATE INDEX IF NOT EXISTS idx_commercial_leads_status ON public.commercial_leads(status);
CREATE INDEX IF NOT EXISTS idx_commercial_leads_origin ON public.commercial_leads(origin);
CREATE INDEX IF NOT EXISTS idx_commercial_leads_contact_id ON public.commercial_leads(contact_id);
CREATE INDEX IF NOT EXISTS idx_commercial_leads_created_at ON public.commercial_leads(created_at);

-- Índices para commercial_procedures
CREATE INDEX IF NOT EXISTS idx_commercial_procedures_user_id ON public.commercial_procedures(user_id);
CREATE INDEX IF NOT EXISTS idx_commercial_procedures_category ON public.commercial_procedures(category);
CREATE INDEX IF NOT EXISTS idx_commercial_procedures_is_active ON public.commercial_procedures(is_active);

-- Índices para commercial_sales
CREATE INDEX IF NOT EXISTS idx_commercial_sales_user_id ON public.commercial_sales(user_id);
CREATE INDEX IF NOT EXISTS idx_commercial_sales_status ON public.commercial_sales(status);
CREATE INDEX IF NOT EXISTS idx_commercial_sales_lead_id ON public.commercial_sales(lead_id);
CREATE INDEX IF NOT EXISTS idx_commercial_sales_contact_id ON public.commercial_sales(contact_id);
CREATE INDEX IF NOT EXISTS idx_commercial_sales_procedure_id ON public.commercial_sales(procedure_id);
CREATE INDEX IF NOT EXISTS idx_commercial_sales_appointment_id ON public.commercial_sales(appointment_id);

-- Índices para commercial_campaigns
CREATE INDEX IF NOT EXISTS idx_commercial_campaigns_user_id ON public.commercial_campaigns(user_id);
CREATE INDEX IF NOT EXISTS idx_commercial_campaigns_type ON public.commercial_campaigns(type);
CREATE INDEX IF NOT EXISTS idx_commercial_campaigns_is_active ON public.commercial_campaigns(is_active);
CREATE INDEX IF NOT EXISTS idx_commercial_campaigns_dates ON public.commercial_campaigns(start_date, end_date);

-- Índices para commercial_lead_interactions
CREATE INDEX IF NOT EXISTS idx_commercial_lead_interactions_lead_id ON public.commercial_lead_interactions(lead_id);
CREATE INDEX IF NOT EXISTS idx_commercial_lead_interactions_user_id ON public.commercial_lead_interactions(user_id);

-- Índices para prospecting_scripts
CREATE INDEX IF NOT EXISTS idx_prospecting_scripts_user_id ON public.prospecting_scripts(user_id);
CREATE INDEX IF NOT EXISTS idx_prospecting_scripts_is_active ON public.prospecting_scripts(is_active);

-- Índices para prospecting_sessions
CREATE INDEX IF NOT EXISTS idx_prospecting_sessions_user_id ON public.prospecting_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_prospecting_sessions_script_id ON public.prospecting_sessions(script_id);
CREATE INDEX IF NOT EXISTS idx_prospecting_sessions_contact_id ON public.prospecting_sessions(contact_id);
CREATE INDEX IF NOT EXISTS idx_prospecting_sessions_started_at ON public.prospecting_sessions(started_at);
CREATE INDEX IF NOT EXISTS idx_prospecting_sessions_result ON public.prospecting_sessions(result);

-- Índices para prospecting_daily_reports
CREATE INDEX IF NOT EXISTS idx_prospecting_daily_reports_user_id ON public.prospecting_daily_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_prospecting_daily_reports_report_date ON public.prospecting_daily_reports(report_date);
CREATE INDEX IF NOT EXISTS idx_prospecting_daily_reports_user_date ON public.prospecting_daily_reports(user_id, report_date);

-- Índices para sales_calls
CREATE INDEX IF NOT EXISTS idx_sales_calls_user_id ON public.sales_calls(user_id);
CREATE INDEX IF NOT EXISTS idx_sales_calls_contact_id ON public.sales_calls(contact_id);
CREATE INDEX IF NOT EXISTS idx_sales_calls_deal_id ON public.sales_calls(deal_id);
CREATE INDEX IF NOT EXISTS idx_sales_calls_scheduled_at ON public.sales_calls(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_sales_calls_status ON public.sales_calls(status);

-- Índices para user_daily_goals
CREATE INDEX IF NOT EXISTS idx_user_daily_goals_user_id ON public.user_daily_goals(user_id);

-- Índices para notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at);

-- =====================================================
-- PARTE 14: TRIGGERS
-- =====================================================

-- Trigger para atualizar updated_at em profiles
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Nota: O trigger on_auth_user_created será criado após a função handle_new_user_from_invitation
-- Ver PARTE 2.1 no final do script

-- Triggers para atualizar updated_at em tabelas CRM
DROP TRIGGER IF EXISTS update_crm_contacts_updated_at ON public.crm_contacts;
CREATE TRIGGER update_crm_contacts_updated_at
    BEFORE UPDATE ON public.crm_contacts
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_crm_deals_updated_at ON public.crm_deals;
CREATE TRIGGER update_crm_deals_updated_at
    BEFORE UPDATE ON public.crm_deals
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Triggers para atualizar updated_at em tasks
DROP TRIGGER IF EXISTS update_tasks_updated_at ON public.tasks;
CREATE TRIGGER update_tasks_updated_at
    BEFORE UPDATE ON public.tasks
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Triggers para atualizar updated_at em tabelas financeiras
DROP TRIGGER IF EXISTS update_financial_accounts_updated_at ON public.financial_accounts;
CREATE TRIGGER update_financial_accounts_updated_at
    BEFORE UPDATE ON public.financial_accounts
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_financial_categories_updated_at ON public.financial_categories;
CREATE TRIGGER update_financial_categories_updated_at
    BEFORE UPDATE ON public.financial_categories
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_financial_transactions_updated_at ON public.financial_transactions;
CREATE TRIGGER update_financial_transactions_updated_at
    BEFORE UPDATE ON public.financial_transactions
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_financial_recurring_updated_at ON public.financial_recurring_transactions;
CREATE TRIGGER update_financial_recurring_updated_at
    BEFORE UPDATE ON public.financial_recurring_transactions
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_financial_budgets_updated_at ON public.financial_budgets;
CREATE TRIGGER update_financial_budgets_updated_at
    BEFORE UPDATE ON public.financial_budgets
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_transaction_costs_updated_at ON public.transaction_costs;
CREATE TRIGGER update_transaction_costs_updated_at
    BEFORE UPDATE ON public.transaction_costs
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Triggers específicos para medical_appointments
DROP TRIGGER IF EXISTS medical_appointments_updated_at ON public.medical_appointments;
CREATE TRIGGER medical_appointments_updated_at
    BEFORE UPDATE ON public.medical_appointments
    FOR EACH ROW
    EXECUTE FUNCTION public.update_medical_appointments_updated_at();

DROP TRIGGER IF EXISTS set_appointment_end_time ON public.medical_appointments;
CREATE TRIGGER set_appointment_end_time
    BEFORE INSERT OR UPDATE ON public.medical_appointments
    FOR EACH ROW
    EXECUTE FUNCTION public.calculate_appointment_end_time();

-- Triggers específicos para general_meetings
DROP TRIGGER IF EXISTS update_general_meetings_updated_at ON public.general_meetings;
CREATE TRIGGER update_general_meetings_updated_at
    BEFORE UPDATE ON public.general_meetings
    FOR EACH ROW
    EXECUTE FUNCTION public.update_general_meetings_updated_at();

-- Triggers para atualizar updated_at em tabelas comerciais
DROP TRIGGER IF EXISTS update_commercial_leads_updated_at ON public.commercial_leads;
CREATE TRIGGER update_commercial_leads_updated_at
    BEFORE UPDATE ON public.commercial_leads
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_commercial_procedures_updated_at ON public.commercial_procedures;
CREATE TRIGGER update_commercial_procedures_updated_at
    BEFORE UPDATE ON public.commercial_procedures
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_commercial_sales_updated_at ON public.commercial_sales;
CREATE TRIGGER update_commercial_sales_updated_at
    BEFORE UPDATE ON public.commercial_sales
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_commercial_campaigns_updated_at ON public.commercial_campaigns;
CREATE TRIGGER update_commercial_campaigns_updated_at
    BEFORE UPDATE ON public.commercial_campaigns
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Triggers para atualizar updated_at em prospecting_scripts
DROP TRIGGER IF EXISTS update_prospecting_scripts_updated_at ON public.prospecting_scripts;
CREATE TRIGGER update_prospecting_scripts_updated_at
    BEFORE UPDATE ON public.prospecting_scripts
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Triggers para atualizar updated_at em prospecting_daily_reports
DROP TRIGGER IF EXISTS update_prospecting_daily_reports_updated_at ON public.prospecting_daily_reports;
CREATE TRIGGER update_prospecting_daily_reports_updated_at
    BEFORE UPDATE ON public.prospecting_daily_reports
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Triggers para atualizar updated_at em sales_calls
DROP TRIGGER IF EXISTS sales_calls_updated_at ON public.sales_calls;
CREATE TRIGGER sales_calls_updated_at
    BEFORE UPDATE ON public.sales_calls
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Triggers para atualizar updated_at em user_daily_goals
DROP TRIGGER IF EXISTS update_user_daily_goals_updated_at ON public.user_daily_goals;
CREATE TRIGGER update_user_daily_goals_updated_at
    BEFORE UPDATE ON public.user_daily_goals
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger para atualizar custos de transação
DROP TRIGGER IF EXISTS trigger_update_transaction_costs ON public.transaction_costs;
CREATE TRIGGER trigger_update_transaction_costs
    AFTER INSERT OR UPDATE OR DELETE ON public.transaction_costs
    FOR EACH ROW
    EXECUTE FUNCTION public.update_transaction_costs();

-- =====================================================
-- PARTE 15: ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_follow_ups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_recurring_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transaction_costs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medical_appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.general_meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commercial_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commercial_procedures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commercial_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commercial_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commercial_lead_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prospecting_scripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prospecting_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prospecting_daily_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_daily_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para profiles
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile"
    ON public.profiles FOR SELECT
    TO authenticated
    USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
    ON public.profiles FOR UPDATE
    TO authenticated
    USING (auth.uid() = id);

DROP POLICY IF EXISTS "Admin and Dono can view all profiles" ON public.profiles;
CREATE POLICY "Admin and Dono can view all profiles"
    ON public.profiles FOR SELECT
    TO authenticated
    USING (public.is_admin_or_dono(auth.uid()));

DROP POLICY IF EXISTS "Admin and Dono can update profiles" ON public.profiles;
CREATE POLICY "Admin and Dono can update profiles"
    ON public.profiles FOR UPDATE
    TO authenticated
    USING (public.is_admin_or_dono(auth.uid()));

DROP POLICY IF EXISTS "Admin and Dono can insert profiles" ON public.profiles;
CREATE POLICY "Admin and Dono can insert profiles"
    ON public.profiles FOR INSERT
    TO authenticated
    WITH CHECK (public.is_admin_or_dono(auth.uid()));

-- Políticas RLS para team_invitations
DROP POLICY IF EXISTS "Admin and Dono can manage invitations" ON public.team_invitations;
CREATE POLICY "Admin and Dono can manage invitations"
    ON public.team_invitations FOR ALL
    TO authenticated
    USING (public.is_admin_or_dono(auth.uid()));

-- Políticas RLS para crm_contacts
DROP POLICY IF EXISTS "Users can view their own contacts" ON public.crm_contacts;
CREATE POLICY "Users can view their own contacts"
    ON public.crm_contacts FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own contacts" ON public.crm_contacts;
CREATE POLICY "Users can insert their own contacts"
    ON public.crm_contacts FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own contacts" ON public.crm_contacts;
CREATE POLICY "Users can update their own contacts"
    ON public.crm_contacts FOR UPDATE
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own contacts" ON public.crm_contacts;
CREATE POLICY "Users can delete their own contacts"
    ON public.crm_contacts FOR DELETE
    USING (auth.uid() = user_id);

-- Políticas RLS para crm_deals
DROP POLICY IF EXISTS "Users can view their own deals" ON public.crm_deals;
CREATE POLICY "Users can view their own deals"
    ON public.crm_deals FOR SELECT
    USING (auth.uid() = user_id OR auth.uid() = assigned_to);

DROP POLICY IF EXISTS "Users can insert their own deals" ON public.crm_deals;
CREATE POLICY "Users can insert their own deals"
    ON public.crm_deals FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own deals or assigned deals" ON public.crm_deals;
CREATE POLICY "Users can update their own deals or assigned deals"
    ON public.crm_deals FOR UPDATE
    USING (auth.uid() = user_id OR auth.uid() = assigned_to);

DROP POLICY IF EXISTS "Users can delete their own deals" ON public.crm_deals;
CREATE POLICY "Users can delete their own deals"
    ON public.crm_deals FOR DELETE
    USING (auth.uid() = user_id);

-- Políticas RLS para crm_activities
DROP POLICY IF EXISTS "Users can view their own activities" ON public.crm_activities;
CREATE POLICY "Users can view their own activities"
    ON public.crm_activities FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own activities" ON public.crm_activities;
CREATE POLICY "Users can insert their own activities"
    ON public.crm_activities FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own activities" ON public.crm_activities;
CREATE POLICY "Users can update their own activities"
    ON public.crm_activities FOR UPDATE
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own activities" ON public.crm_activities;
CREATE POLICY "Users can delete their own activities"
    ON public.crm_activities FOR DELETE
    USING (auth.uid() = user_id);

-- Políticas RLS para crm_follow_ups
DROP POLICY IF EXISTS "Authenticated users can view crm_follow_ups" ON public.crm_follow_ups;
CREATE POLICY "Authenticated users can view crm_follow_ups"
    ON public.crm_follow_ups FOR SELECT
    TO authenticated USING (true);

DROP POLICY IF EXISTS "Authenticated users can manage crm_follow_ups" ON public.crm_follow_ups;
CREATE POLICY "Authenticated users can manage crm_follow_ups"
    ON public.crm_follow_ups FOR ALL
    TO authenticated USING (true) WITH CHECK (true);

-- Políticas RLS para tasks
DROP POLICY IF EXISTS "Authenticated users can view tasks" ON public.tasks;
CREATE POLICY "Authenticated users can view tasks"
    ON public.tasks FOR SELECT
    TO authenticated USING (true);

DROP POLICY IF EXISTS "Authenticated users can manage tasks" ON public.tasks;
CREATE POLICY "Authenticated users can manage tasks"
    ON public.tasks FOR ALL
    TO authenticated USING (true) WITH CHECK (true);

-- Políticas RLS para financial_accounts
DROP POLICY IF EXISTS "financial_accounts_select_policy" ON public.financial_accounts;
CREATE POLICY "financial_accounts_select_policy"
    ON public.financial_accounts FOR SELECT
    TO authenticated
    USING (is_admin_or_dono(auth.uid()) OR user_id = auth.uid());

DROP POLICY IF EXISTS "financial_accounts_insert_policy" ON public.financial_accounts;
CREATE POLICY "financial_accounts_insert_policy"
    ON public.financial_accounts FOR INSERT
    TO authenticated
    WITH CHECK (is_admin_or_dono(auth.uid()) AND user_id = auth.uid());

DROP POLICY IF EXISTS "financial_accounts_update_policy" ON public.financial_accounts;
CREATE POLICY "financial_accounts_update_policy"
    ON public.financial_accounts FOR UPDATE
    TO authenticated
    USING (is_admin_or_dono(auth.uid()) AND user_id = auth.uid())
    WITH CHECK (is_admin_or_dono(auth.uid()) AND user_id = auth.uid());

DROP POLICY IF EXISTS "financial_accounts_delete_policy" ON public.financial_accounts;
CREATE POLICY "financial_accounts_delete_policy"
    ON public.financial_accounts FOR DELETE
    TO authenticated
    USING (is_admin_or_dono(auth.uid()) AND user_id = auth.uid());

-- Políticas RLS para financial_categories
DROP POLICY IF EXISTS "financial_categories_select_policy" ON public.financial_categories;
CREATE POLICY "financial_categories_select_policy"
    ON public.financial_categories FOR SELECT
    TO authenticated
    USING (is_system = true OR is_admin_or_dono(auth.uid()));

DROP POLICY IF EXISTS "financial_categories_insert_policy" ON public.financial_categories;
CREATE POLICY "financial_categories_insert_policy"
    ON public.financial_categories FOR INSERT
    TO authenticated
    WITH CHECK (is_admin_or_dono(auth.uid()) AND is_system = false);

DROP POLICY IF EXISTS "financial_categories_update_policy" ON public.financial_categories;
CREATE POLICY "financial_categories_update_policy"
    ON public.financial_categories FOR UPDATE
    TO authenticated
    USING (is_admin_or_dono(auth.uid()) AND is_system = false)
    WITH CHECK (is_admin_or_dono(auth.uid()) AND is_system = false);

DROP POLICY IF EXISTS "financial_categories_delete_policy" ON public.financial_categories;
CREATE POLICY "financial_categories_delete_policy"
    ON public.financial_categories FOR DELETE
    TO authenticated
    USING (is_admin_or_dono(auth.uid()) AND is_system = false);

-- Políticas RLS para financial_transactions
DROP POLICY IF EXISTS "financial_transactions_select_policy" ON public.financial_transactions;
CREATE POLICY "financial_transactions_select_policy"
    ON public.financial_transactions FOR SELECT
    TO authenticated
    USING (is_admin_or_dono(auth.uid()) OR user_id = auth.uid());

DROP POLICY IF EXISTS "financial_transactions_insert_policy" ON public.financial_transactions;
CREATE POLICY "financial_transactions_insert_policy"
    ON public.financial_transactions FOR INSERT
    TO authenticated
    WITH CHECK (is_admin_or_dono(auth.uid()) AND user_id = auth.uid());

DROP POLICY IF EXISTS "financial_transactions_update_policy" ON public.financial_transactions;
CREATE POLICY "financial_transactions_update_policy"
    ON public.financial_transactions FOR UPDATE
    TO authenticated
    USING (is_admin_or_dono(auth.uid()) AND user_id = auth.uid())
    WITH CHECK (is_admin_or_dono(auth.uid()) AND user_id = auth.uid());

DROP POLICY IF EXISTS "financial_transactions_delete_policy" ON public.financial_transactions;
CREATE POLICY "financial_transactions_delete_policy"
    ON public.financial_transactions FOR DELETE
    TO authenticated
    USING (is_admin_or_dono(auth.uid()) AND user_id = auth.uid());

-- Políticas RLS para financial_attachments
DROP POLICY IF EXISTS "financial_attachments_select_policy" ON public.financial_attachments;
CREATE POLICY "financial_attachments_select_policy"
    ON public.financial_attachments FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM financial_transactions ft
            WHERE ft.id = financial_attachments.transaction_id
            AND (is_admin_or_dono(auth.uid()) OR ft.user_id = auth.uid())
        )
    );

DROP POLICY IF EXISTS "financial_attachments_insert_policy" ON public.financial_attachments;
CREATE POLICY "financial_attachments_insert_policy"
    ON public.financial_attachments FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM financial_transactions ft
            WHERE ft.id = financial_attachments.transaction_id
            AND is_admin_or_dono(auth.uid())
            AND ft.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "financial_attachments_delete_policy" ON public.financial_attachments;
CREATE POLICY "financial_attachments_delete_policy"
    ON public.financial_attachments FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM financial_transactions ft
            WHERE ft.id = financial_attachments.transaction_id
            AND is_admin_or_dono(auth.uid())
            AND ft.user_id = auth.uid()
        )
    );

-- Políticas RLS para financial_recurring_transactions
DROP POLICY IF EXISTS "financial_recurring_select_policy" ON public.financial_recurring_transactions;
CREATE POLICY "financial_recurring_select_policy"
    ON public.financial_recurring_transactions FOR SELECT
    TO authenticated
    USING (is_admin_or_dono(auth.uid()) OR user_id = auth.uid());

DROP POLICY IF EXISTS "financial_recurring_insert_policy" ON public.financial_recurring_transactions;
CREATE POLICY "financial_recurring_insert_policy"
    ON public.financial_recurring_transactions FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "financial_recurring_update_policy" ON public.financial_recurring_transactions;
CREATE POLICY "financial_recurring_update_policy"
    ON public.financial_recurring_transactions FOR UPDATE
    TO authenticated
    USING (is_admin_or_dono(auth.uid()) OR user_id = auth.uid())
    WITH CHECK (is_admin_or_dono(auth.uid()) OR user_id = auth.uid());

DROP POLICY IF EXISTS "financial_recurring_delete_policy" ON public.financial_recurring_transactions;
CREATE POLICY "financial_recurring_delete_policy"
    ON public.financial_recurring_transactions FOR DELETE
    TO authenticated
    USING (is_admin_or_dono(auth.uid()) OR user_id = auth.uid());

-- Políticas RLS para financial_budgets
DROP POLICY IF EXISTS "financial_budgets_select_policy" ON public.financial_budgets;
CREATE POLICY "financial_budgets_select_policy"
    ON public.financial_budgets FOR SELECT
    TO authenticated
    USING (is_admin_or_dono(auth.uid()) OR user_id = auth.uid());

DROP POLICY IF EXISTS "financial_budgets_insert_policy" ON public.financial_budgets;
CREATE POLICY "financial_budgets_insert_policy"
    ON public.financial_budgets FOR INSERT
    TO authenticated
    WITH CHECK (is_admin_or_dono(auth.uid()) AND user_id = auth.uid());

DROP POLICY IF EXISTS "financial_budgets_update_policy" ON public.financial_budgets;
CREATE POLICY "financial_budgets_update_policy"
    ON public.financial_budgets FOR UPDATE
    TO authenticated
    USING (is_admin_or_dono(auth.uid()) AND user_id = auth.uid())
    WITH CHECK (is_admin_or_dono(auth.uid()) AND user_id = auth.uid());

DROP POLICY IF EXISTS "financial_budgets_delete_policy" ON public.financial_budgets;
CREATE POLICY "financial_budgets_delete_policy"
    ON public.financial_budgets FOR DELETE
    TO authenticated
    USING (is_admin_or_dono(auth.uid()) AND user_id = auth.uid());

-- Políticas RLS para transaction_costs
DROP POLICY IF EXISTS "Users can view their own transaction costs" ON public.transaction_costs;
CREATE POLICY "Users can view their own transaction costs"
    ON public.transaction_costs FOR SELECT
    USING (
        transaction_id IN (
            SELECT id FROM financial_transactions WHERE user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can insert costs to their transactions" ON public.transaction_costs;
CREATE POLICY "Users can insert costs to their transactions"
    ON public.transaction_costs FOR INSERT
    WITH CHECK (
        transaction_id IN (
            SELECT id FROM financial_transactions WHERE user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can update their own transaction costs" ON public.transaction_costs;
CREATE POLICY "Users can update their own transaction costs"
    ON public.transaction_costs FOR UPDATE
    USING (
        transaction_id IN (
            SELECT id FROM financial_transactions WHERE user_id = auth.uid()
        )
    )
    WITH CHECK (
        transaction_id IN (
            SELECT id FROM financial_transactions WHERE user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can delete their own transaction costs" ON public.transaction_costs;
CREATE POLICY "Users can delete their own transaction costs"
    ON public.transaction_costs FOR DELETE
    USING (
        transaction_id IN (
            SELECT id FROM financial_transactions WHERE user_id = auth.uid()
        )
    );

-- Políticas RLS para medical_appointments
DROP POLICY IF EXISTS "Users can view appointments" ON public.medical_appointments;
CREATE POLICY "Users can view appointments"
    ON public.medical_appointments FOR SELECT
    TO authenticated
    USING (true);

DROP POLICY IF EXISTS "Users can insert own appointments" ON public.medical_appointments;
CREATE POLICY "Users can insert own appointments"
    ON public.medical_appointments FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update appointments" ON public.medical_appointments;
CREATE POLICY "Users can update appointments"
    ON public.medical_appointments FOR UPDATE
    TO authenticated
    USING (
        auth.uid() = user_id
        OR EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid()
            AND role IN ('admin', 'dono')
        )
    )
    WITH CHECK (
        auth.uid() = user_id
        OR EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid()
            AND role IN ('admin', 'dono')
        )
    );

DROP POLICY IF EXISTS "Users can delete appointments" ON public.medical_appointments;
CREATE POLICY "Users can delete appointments"
    ON public.medical_appointments FOR DELETE
    TO authenticated
    USING (
        auth.uid() = user_id
        OR EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid()
            AND role IN ('admin', 'dono')
        )
    );

-- Políticas RLS para general_meetings
DROP POLICY IF EXISTS "Users can view their own meetings" ON public.general_meetings;
CREATE POLICY "Users can view their own meetings"
    ON public.general_meetings FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own meetings" ON public.general_meetings;
CREATE POLICY "Users can insert their own meetings"
    ON public.general_meetings FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own meetings" ON public.general_meetings;
CREATE POLICY "Users can update their own meetings"
    ON public.general_meetings FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own meetings" ON public.general_meetings;
CREATE POLICY "Users can delete their own meetings"
    ON public.general_meetings FOR DELETE
    USING (auth.uid() = user_id);

-- Políticas RLS para commercial_leads
DROP POLICY IF EXISTS "Users can view their own commercial leads" ON public.commercial_leads;
CREATE POLICY "Users can view their own commercial leads"
    ON public.commercial_leads FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own commercial leads" ON public.commercial_leads;
CREATE POLICY "Users can insert their own commercial leads"
    ON public.commercial_leads FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own commercial leads" ON public.commercial_leads;
CREATE POLICY "Users can update their own commercial leads"
    ON public.commercial_leads FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own commercial leads" ON public.commercial_leads;
CREATE POLICY "Users can delete their own commercial leads"
    ON public.commercial_leads FOR DELETE
    USING (auth.uid() = user_id);

-- Políticas RLS para commercial_procedures
DROP POLICY IF EXISTS "Users can view their own commercial procedures" ON public.commercial_procedures;
CREATE POLICY "Users can view their own commercial procedures"
    ON public.commercial_procedures FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own commercial procedures" ON public.commercial_procedures;
CREATE POLICY "Users can insert their own commercial procedures"
    ON public.commercial_procedures FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own commercial procedures" ON public.commercial_procedures;
CREATE POLICY "Users can update their own commercial procedures"
    ON public.commercial_procedures FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own commercial procedures" ON public.commercial_procedures;
CREATE POLICY "Users can delete their own commercial procedures"
    ON public.commercial_procedures FOR DELETE
    USING (auth.uid() = user_id);

-- Políticas RLS para commercial_sales
DROP POLICY IF EXISTS "Users can view their own commercial sales" ON public.commercial_sales;
CREATE POLICY "Users can view their own commercial sales"
    ON public.commercial_sales FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own commercial sales" ON public.commercial_sales;
CREATE POLICY "Users can insert their own commercial sales"
    ON public.commercial_sales FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own commercial sales" ON public.commercial_sales;
CREATE POLICY "Users can update their own commercial sales"
    ON public.commercial_sales FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own commercial sales" ON public.commercial_sales;
CREATE POLICY "Users can delete their own commercial sales"
    ON public.commercial_sales FOR DELETE
    USING (auth.uid() = user_id);

-- Políticas RLS para commercial_campaigns
DROP POLICY IF EXISTS "Users can view their own commercial campaigns" ON public.commercial_campaigns;
CREATE POLICY "Users can view their own commercial campaigns"
    ON public.commercial_campaigns FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own commercial campaigns" ON public.commercial_campaigns;
CREATE POLICY "Users can insert their own commercial campaigns"
    ON public.commercial_campaigns FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own commercial campaigns" ON public.commercial_campaigns;
CREATE POLICY "Users can update their own commercial campaigns"
    ON public.commercial_campaigns FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own commercial campaigns" ON public.commercial_campaigns;
CREATE POLICY "Users can delete their own commercial campaigns"
    ON public.commercial_campaigns FOR DELETE
    USING (auth.uid() = user_id);

-- Políticas RLS para commercial_lead_interactions
DROP POLICY IF EXISTS "Users can view their own commercial lead interactions" ON public.commercial_lead_interactions;
CREATE POLICY "Users can view their own commercial lead interactions"
    ON public.commercial_lead_interactions FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own commercial lead interactions" ON public.commercial_lead_interactions;
CREATE POLICY "Users can insert their own commercial lead interactions"
    ON public.commercial_lead_interactions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Políticas RLS para prospecting_scripts
DROP POLICY IF EXISTS "Users can view their own prospecting scripts" ON public.prospecting_scripts;
CREATE POLICY "Users can view their own prospecting scripts"
    ON public.prospecting_scripts FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage their own prospecting scripts" ON public.prospecting_scripts;
CREATE POLICY "Users can manage their own prospecting scripts"
    ON public.prospecting_scripts FOR ALL
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Políticas RLS para prospecting_sessions
DROP POLICY IF EXISTS "Users can view their own prospecting sessions" ON public.prospecting_sessions;
CREATE POLICY "Users can view their own prospecting sessions"
    ON public.prospecting_sessions FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage their own prospecting sessions" ON public.prospecting_sessions;
CREATE POLICY "Users can manage their own prospecting sessions"
    ON public.prospecting_sessions FOR ALL
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Políticas RLS para prospecting_daily_reports
DROP POLICY IF EXISTS "Users can view their own prospecting daily reports" ON public.prospecting_daily_reports;
CREATE POLICY "Users can view their own prospecting daily reports"
    ON public.prospecting_daily_reports FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage their own prospecting daily reports" ON public.prospecting_daily_reports;
CREATE POLICY "Users can manage their own prospecting daily reports"
    ON public.prospecting_daily_reports FOR ALL
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Políticas RLS para sales_calls
DROP POLICY IF EXISTS "Users can view own sales calls" ON public.sales_calls;
CREATE POLICY "Users can view own sales calls"
    ON public.sales_calls FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own sales calls" ON public.sales_calls;
CREATE POLICY "Users can insert own sales calls"
    ON public.sales_calls FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own sales calls" ON public.sales_calls;
CREATE POLICY "Users can update own sales calls"
    ON public.sales_calls FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own sales calls" ON public.sales_calls;
CREATE POLICY "Users can delete own sales calls"
    ON public.sales_calls FOR DELETE
    USING (auth.uid() = user_id);

-- Políticas RLS para user_daily_goals
DROP POLICY IF EXISTS "Users can only access their own daily goals" ON public.user_daily_goals;
CREATE POLICY "Users can only access their own daily goals"
    ON public.user_daily_goals FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Políticas RLS para notifications
DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
CREATE POLICY "Users can view own notifications"
    ON public.notifications FOR SELECT
    USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can manage own notifications" ON public.notifications;
CREATE POLICY "Users can manage own notifications"
    ON public.notifications FOR ALL
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- =====================================================
-- PARTE 16: VIEWS
-- =====================================================

-- View para transações com lucro líquido
CREATE OR REPLACE VIEW public.vw_transactions_with_net_profit 
WITH (security_invoker = true)
AS
SELECT 
    t.id,
    t.user_id,
    t.type,
    t.description,
    t.amount AS gross_amount,
    t.total_costs,
    (t.amount - COALESCE(t.total_costs, 0)) AS net_amount,
    CASE
        WHEN t.amount > 0 THEN (((t.amount - COALESCE(t.total_costs, 0)) / t.amount) * 100)
        ELSE 0
    END AS profit_margin_percentage,
    t.transaction_date,
    t.category_id,
    t.account_id,
    t.has_costs,
    t.created_at,
    t.updated_at
FROM public.financial_transactions t
WHERE t.type = 'entrada';

COMMENT ON VIEW public.vw_transactions_with_net_profit IS 'View com cálculo de lucro líquido para transações de entrada';

-- =====================================================
-- PARTE 17: STORAGE BUCKETS
-- =====================================================

-- Bucket para avatares de usuários
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies para avatares
DROP POLICY IF EXISTS "Users can upload their own avatars" ON storage.objects;
CREATE POLICY "Users can upload their own avatars"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'avatars' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

DROP POLICY IF EXISTS "Users can view all avatars" ON storage.objects;
CREATE POLICY "Users can view all avatars"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Users can update their own avatars" ON storage.objects;
CREATE POLICY "Users can update their own avatars"
    ON storage.objects FOR UPDATE
    USING (
        bucket_id = 'avatars' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

DROP POLICY IF EXISTS "Users can delete their own avatars" ON storage.objects;
CREATE POLICY "Users can delete their own avatars"
    ON storage.objects FOR DELETE
    USING (
        bucket_id = 'avatars' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

-- Bucket para imagens de tarefas
INSERT INTO storage.buckets (id, name, public)
VALUES ('task-images', 'task-images', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies para task-images
DROP POLICY IF EXISTS "Users can upload task images" ON storage.objects;
CREATE POLICY "Users can upload task images"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'task-images' AND
        auth.role() = 'authenticated'
    );

DROP POLICY IF EXISTS "Users can view task images" ON storage.objects;
CREATE POLICY "Users can view task images"
    ON storage.objects FOR SELECT
    USING (
        bucket_id = 'task-images' AND
        auth.role() = 'authenticated'
    );

DROP POLICY IF EXISTS "Users can update task images" ON storage.objects;
CREATE POLICY "Users can update task images"
    ON storage.objects FOR UPDATE
    USING (
        bucket_id = 'task-images' AND
        auth.role() = 'authenticated'
    );

DROP POLICY IF EXISTS "Users can delete task images" ON storage.objects;
CREATE POLICY "Users can delete task images"
    ON storage.objects FOR DELETE
    USING (
        bucket_id = 'task-images' AND
        auth.role() = 'authenticated'
    );

-- =====================================================
-- FIM DO SCRIPT DE MIGRAÇÃO
-- =====================================================

