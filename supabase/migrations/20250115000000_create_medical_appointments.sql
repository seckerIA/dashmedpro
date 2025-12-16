-- Create appointment_type enum
CREATE TYPE public.appointment_type AS ENUM (
  'first_visit',      -- Primeira consulta
  'return',           -- Retorno
  'procedure',        -- Procedimento
  'urgent',           -- Urgência
  'follow_up',        -- Acompanhamento
  'exam'              -- Exame
);

-- Create appointment_status enum
CREATE TYPE public.appointment_status AS ENUM (
  'scheduled',        -- Agendado
  'confirmed',        -- Confirmado
  'in_progress',      -- Em andamento
  'completed',        -- Concluído
  'cancelled',        -- Cancelado
  'no_show'           -- Não compareceu
);

-- Create payment_status enum
CREATE TYPE public.payment_status AS ENUM (
  'pending',          -- Pendente
  'paid',             -- Pago
  'partial',          -- Parcial
  'cancelled'         -- Cancelado
);

-- Create medical_appointments table
CREATE TABLE IF NOT EXISTS public.medical_appointments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    contact_id UUID NOT NULL REFERENCES public.crm_contacts(id) ON DELETE CASCADE,

    -- Appointment details
    title TEXT NOT NULL,
    appointment_type public.appointment_type NOT NULL DEFAULT 'first_visit',
    status public.appointment_status NOT NULL DEFAULT 'scheduled',

    -- Scheduling
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    duration_minutes INTEGER NOT NULL DEFAULT 30,

    -- Additional info
    notes TEXT,
    internal_notes TEXT,  -- Private notes (not visible to patient)

    -- Financial integration
    estimated_value DECIMAL(10,2),
    payment_status public.payment_status DEFAULT 'pending',
    financial_transaction_id UUID REFERENCES public.financial_transactions(id) ON DELETE SET NULL,

    -- Metadata
    completed_at TIMESTAMP WITH TIME ZONE,
    cancelled_at TIMESTAMP WITH TIME ZONE,
    cancellation_reason TEXT,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,

    -- Constraints
    CONSTRAINT valid_time_range CHECK (end_time > start_time),
    CONSTRAINT valid_duration CHECK (duration_minutes > 0 AND duration_minutes <= 480)
);

-- Create indexes for performance
CREATE INDEX idx_medical_appointments_user_id ON public.medical_appointments(user_id);
CREATE INDEX idx_medical_appointments_contact_id ON public.medical_appointments(contact_id);
CREATE INDEX idx_medical_appointments_start_time ON public.medical_appointments(start_time);
CREATE INDEX idx_medical_appointments_status ON public.medical_appointments(status);
CREATE INDEX idx_medical_appointments_appointment_type ON public.medical_appointments(appointment_type);
CREATE INDEX idx_medical_appointments_payment_status ON public.medical_appointments(payment_status);
CREATE INDEX idx_medical_appointments_financial_transaction_id ON public.medical_appointments(financial_transaction_id);

-- Composite index for calendar queries (user + date range)
CREATE INDEX idx_medical_appointments_user_time ON public.medical_appointments(user_id, start_time, end_time);

-- Enable RLS
ALTER TABLE public.medical_appointments ENABLE ROW LEVEL SECURITY;

-- RLS Policies (Multi-role access: admin, dono, vendedor, gestor_trafego)
-- All authenticated users can view appointments
CREATE POLICY "Users can view appointments" ON public.medical_appointments
    FOR SELECT
    TO authenticated
    USING (true);

-- Users can insert their own appointments
CREATE POLICY "Users can insert own appointments" ON public.medical_appointments
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- Users can update appointments
-- Admin/Dono can update any, others can update their own
CREATE POLICY "Users can update appointments" ON public.medical_appointments
    FOR UPDATE
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

-- Users can delete appointments
-- Admin/Dono can delete any, others can delete their own
CREATE POLICY "Users can delete appointments" ON public.medical_appointments
    FOR DELETE
    TO authenticated
    USING (
        auth.uid() = user_id
        OR EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid()
            AND role IN ('admin', 'dono')
        )
    );

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_medical_appointments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER medical_appointments_updated_at
    BEFORE UPDATE ON public.medical_appointments
    FOR EACH ROW
    EXECUTE FUNCTION update_medical_appointments_updated_at();

-- Create function to automatically calculate end_time based on duration
CREATE OR REPLACE FUNCTION calculate_appointment_end_time()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.duration_minutes IS NOT NULL AND NEW.start_time IS NOT NULL THEN
        NEW.end_time = NEW.start_time + (NEW.duration_minutes || ' minutes')::INTERVAL;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_appointment_end_time
    BEFORE INSERT OR UPDATE ON public.medical_appointments
    FOR EACH ROW
    EXECUTE FUNCTION calculate_appointment_end_time();

-- Add comments for documentation
COMMENT ON TABLE public.medical_appointments IS 'Medical appointment scheduling system with CRM and financial integration';
COMMENT ON COLUMN public.medical_appointments.appointment_type IS 'Type of appointment: first_visit, return, procedure, urgent, follow_up, exam';
COMMENT ON COLUMN public.medical_appointments.status IS 'Current status: scheduled, confirmed, in_progress, completed, cancelled, no_show';
COMMENT ON COLUMN public.medical_appointments.payment_status IS 'Payment status: pending, paid, partial, cancelled';
COMMENT ON COLUMN public.medical_appointments.internal_notes IS 'Private notes for staff only, not visible to patients';
