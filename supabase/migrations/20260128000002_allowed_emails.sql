-- Migration: Create allowed_emails table for dynamic whitelist
-- Description: Allows managing which emails can register via Google OAuth
--              without needing to modify code.

-- ============================================
-- 1. Create allowed_emails table
-- ============================================
CREATE TABLE IF NOT EXISTS public.allowed_emails (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    email text NOT NULL,
    name text,                          -- Nome do cliente (opcional)
    plan text DEFAULT 'basic',          -- Plano contratado
    expires_at timestamptz,             -- Data de expiração (null = sem expiração)
    used_at timestamptz,                -- Data que o email foi usado para registro
    notes text,                         -- Observações internas
    created_at timestamptz DEFAULT now(),
    created_by uuid REFERENCES auth.users(id),  -- Quem adicionou
    CONSTRAINT allowed_emails_email_unique UNIQUE (email)
);

-- ============================================
-- 2. Enable RLS
-- ============================================
ALTER TABLE public.allowed_emails ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 3. RLS Policies
-- ============================================

-- Policy: Anyone can check if an email is allowed (needed for auth callback)
-- This uses service_role for the actual check, but we need a permissive policy
CREATE POLICY "Allow checking emails during auth"
ON public.allowed_emails
FOR SELECT
USING (true);  -- Allow all reads - the table only contains allowed emails anyway

-- Policy: Super admins can manage all emails
CREATE POLICY "Super admins manage allowed emails"
ON public.allowed_emails
FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND is_super_admin = true
    )
);

-- ============================================
-- 4. Create index for fast email lookup
-- ============================================
CREATE INDEX IF NOT EXISTS idx_allowed_emails_email_lower
ON public.allowed_emails(lower(email));

-- ============================================
-- 5. Grant permissions
-- ============================================
GRANT SELECT ON public.allowed_emails TO authenticated;
GRANT SELECT ON public.allowed_emails TO anon;  -- Needed for auth callback before user is created
GRANT ALL ON public.allowed_emails TO service_role;

-- ============================================
-- 6. Add comment for documentation
-- ============================================
COMMENT ON TABLE public.allowed_emails IS 'Whitelist of emails allowed to register via Google OAuth. Add emails here after customer payment.';
COMMENT ON COLUMN public.allowed_emails.email IS 'Email address that is allowed to register';
COMMENT ON COLUMN public.allowed_emails.plan IS 'Subscription plan (basic, pro, enterprise)';
COMMENT ON COLUMN public.allowed_emails.expires_at IS 'When the access expires (null = never)';
COMMENT ON COLUMN public.allowed_emails.used_at IS 'When the email was used to register (null = not used yet)';
