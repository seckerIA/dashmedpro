-- Migration: Add enable_agenda_alerts preference to profiles
-- Description: Allows doctors to enable/disable appointment reminders 10 minutes before consultations

-- Add the preference column to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS enable_agenda_alerts BOOLEAN DEFAULT true;

-- Add comment for documentation
COMMENT ON COLUMN public.profiles.enable_agenda_alerts IS
  'Enables visual alerts 10 minutes before scheduled appointments. Default: true';

-- Create index for efficient filtering (useful if querying users with alerts enabled)
CREATE INDEX IF NOT EXISTS idx_profiles_agenda_alerts
ON public.profiles(enable_agenda_alerts)
WHERE enable_agenda_alerts = true;
