-- Migration: Create meta_oauth_sessions table for Meta Business Platform OAuth
-- This table stores temporary OAuth sessions with access tokens and fetched assets

-- Create the table
CREATE TABLE IF NOT EXISTS public.meta_oauth_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  access_token TEXT NOT NULL,
  token_expires_at TIMESTAMPTZ NOT NULL,
  businesses JSONB DEFAULT '[]'::jsonb,
  whatsapp_accounts JSONB DEFAULT '[]'::jsonb,
  ad_accounts JSONB DEFAULT '[]'::jsonb,
  expires_at TIMESTAMPTZ NOT NULL, -- Session expiration (30 min)
  created_at TIMESTAMPTZ DEFAULT now(),

  -- Ensure one active session per user
  CONSTRAINT meta_oauth_sessions_user_unique UNIQUE (user_id)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_meta_oauth_sessions_user_id ON public.meta_oauth_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_meta_oauth_sessions_expires_at ON public.meta_oauth_sessions(expires_at);

-- Enable RLS
ALTER TABLE public.meta_oauth_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can only see their own sessions
CREATE POLICY "Users can view own oauth sessions"
  ON public.meta_oauth_sessions
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own sessions
CREATE POLICY "Users can insert own oauth sessions"
  ON public.meta_oauth_sessions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own sessions
CREATE POLICY "Users can update own oauth sessions"
  ON public.meta_oauth_sessions
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own sessions
CREATE POLICY "Users can delete own oauth sessions"
  ON public.meta_oauth_sessions
  FOR DELETE
  USING (auth.uid() = user_id);

-- Service role bypass (for Edge Functions)
CREATE POLICY "Service role full access to oauth sessions"
  ON public.meta_oauth_sessions
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- Add comment
COMMENT ON TABLE public.meta_oauth_sessions IS 'Temporary OAuth sessions for Meta Business Platform integration';

-- Function to auto-cleanup expired sessions
CREATE OR REPLACE FUNCTION cleanup_expired_meta_oauth_sessions()
RETURNS void AS $$
BEGIN
  DELETE FROM public.meta_oauth_sessions WHERE expires_at < now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION cleanup_expired_meta_oauth_sessions() TO authenticated;
