-- Migration: Cleanup Duplicate Procedures
-- Description: Removes duplicate entries in specialty_procedures and commercial_procedures
--              by normalizing names (removing accents) and keeping the most recent entry.

-- ============================================
-- 1. Create helper function to normalize text (remove accents)
-- ============================================
CREATE OR REPLACE FUNCTION public.normalize_text(input_text text)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
    SELECT translate(
        input_text,
        'áàâãäéèêëíìîïóòôõöúùûüçÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇ',
        'aaaaaeeeeiiiiooooouuuucAAAAAEEEEIIIIOOOOOUUUUC'
    );
$$;

-- ============================================
-- 2. Delete duplicate specialty_procedures (keeping first entry)
-- ============================================
-- This removes duplicates where normalized names match but original names differ
DELETE FROM public.specialty_procedures a
USING public.specialty_procedures b
WHERE a.id > b.id
  AND a.specialty = b.specialty
  AND normalize_text(a.name) = normalize_text(b.name);

-- ============================================
-- 3. Delete duplicate commercial_procedures (keeping first entry per user)
-- ============================================
-- This removes duplicates where normalized names match within same user
DELETE FROM public.commercial_procedures a
USING public.commercial_procedures b
WHERE a.id > b.id
  AND a.user_id = b.user_id
  AND normalize_text(a.name) = normalize_text(b.name);

-- ============================================
-- 4. Update existing entries to use normalized names
-- ============================================
UPDATE public.specialty_procedures
SET name = normalize_text(name)
WHERE name != normalize_text(name);

UPDATE public.commercial_procedures
SET name = normalize_text(name)
WHERE name != normalize_text(name);

-- ============================================
-- 5. Add comment for documentation
-- ============================================
COMMENT ON FUNCTION public.normalize_text IS 'Removes accents from text for comparison purposes';
