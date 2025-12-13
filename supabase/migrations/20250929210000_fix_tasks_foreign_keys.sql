-- Fix foreign keys in tasks table to point to profiles instead of auth.users
-- This allows Supabase to properly resolve relationships for assigned_to and created_by
-- 
-- Problem: The tasks table was created with foreign keys pointing to auth.users(id)
-- but the frontend code expects to join with the profiles table.
-- Since profiles.id references auth.users(id), we can safely change this.

-- Drop existing foreign key constraints
ALTER TABLE public.tasks 
  DROP CONSTRAINT IF EXISTS tasks_created_by_fkey;

ALTER TABLE public.tasks 
  DROP CONSTRAINT IF EXISTS tasks_assigned_to_fkey;

-- Add new foreign key constraints pointing to profiles
-- This allows Supabase to recognize the relationship and enable joins
ALTER TABLE public.tasks 
  ADD CONSTRAINT tasks_created_by_fkey 
    FOREIGN KEY (created_by) 
    REFERENCES public.profiles(id) 
    ON DELETE SET NULL;

ALTER TABLE public.tasks 
  ADD CONSTRAINT tasks_assigned_to_fkey 
    FOREIGN KEY (assigned_to) 
    REFERENCES public.profiles(id) 
    ON DELETE SET NULL;

-- Add comment to document the change
COMMENT ON CONSTRAINT tasks_created_by_fkey ON public.tasks IS 
  'References profiles table to enable relationship queries in Supabase client';

COMMENT ON CONSTRAINT tasks_assigned_to_fkey ON public.tasks IS 
  'References profiles table to enable relationship queries in Supabase client';
