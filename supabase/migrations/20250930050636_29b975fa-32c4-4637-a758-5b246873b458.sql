-- Create enum for task categories
CREATE TYPE public.task_category AS ENUM ('comercial', 'marketing', 'financeiro', 'social_media', 'empresarial');

-- Add category column to tasks table
ALTER TABLE public.tasks ADD COLUMN category public.task_category DEFAULT 'comercial';