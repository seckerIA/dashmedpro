-- Migration: Add member_limit to organizations
-- Description: Limits number of members per organization. Default is 1 (owner only).
--              Additional members require upgrade payment.

-- ============================================
-- 1. Add member_limit column to organizations
-- ============================================
ALTER TABLE public.organizations
ADD COLUMN IF NOT EXISTS member_limit integer DEFAULT 1;

-- ============================================
-- 2. Add additional_member_price column
-- ============================================
ALTER TABLE public.organizations
ADD COLUMN IF NOT EXISTS additional_member_price decimal(10,2) DEFAULT 89.90;

-- ============================================
-- 3. Add comments
-- ============================================
COMMENT ON COLUMN public.organizations.member_limit IS 'Maximum number of members allowed in this organization. Default is 1 (just the owner).';
COMMENT ON COLUMN public.organizations.additional_member_price IS 'Price to add one additional member (in BRL). Default is R$89,90.';

-- ============================================
-- 4. Create function to count organization members
-- ============================================
CREATE OR REPLACE FUNCTION public.get_organization_member_count(org_id uuid)
RETURNS integer
LANGUAGE sql
SECURITY DEFINER
AS $$
    SELECT COUNT(*)::integer
    FROM public.organization_members
    WHERE organization_id = org_id;
$$;

-- ============================================
-- 5. Create function to check if organization can add members
-- ============================================
CREATE OR REPLACE FUNCTION public.can_add_member(org_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
AS $$
    SELECT (
        SELECT COUNT(*)::integer
        FROM public.organization_members
        WHERE organization_id = org_id
    ) < (
        SELECT COALESCE(member_limit, 1)
        FROM public.organizations
        WHERE id = org_id
    );
$$;

-- ============================================
-- 6. Update existing organizations to have unlimited members (for backwards compatibility)
-- ============================================
UPDATE public.organizations
SET member_limit = 999
WHERE member_limit IS NULL OR member_limit = 1;
