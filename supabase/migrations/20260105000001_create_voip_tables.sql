-- =====================================================
-- VOIP Integration Tables for DashMedPro
-- Provider: WhatsApp Cloud API + SIP Trunking + Twilio Bridge
-- Created: 2026-01-05
-- Updated: 2026-01-05 (WhatsApp Voice API Integration)
-- =====================================================

-- =====================================================
-- 1. ENUM TYPES
-- =====================================================

-- Call status enum
DO $$ BEGIN
  CREATE TYPE voip_call_status AS ENUM (
    'initiating',   -- Call being set up
    'ringing',      -- Ringing on recipient side
    'in_progress',  -- Connected, active call
    'on_hold',      -- Call on hold
    'completed',    -- Successfully ended
    'failed',       -- Connection failed
    'busy',         -- Recipient busy
    'no_answer',    -- No answer
    'cancelled'     -- Caller cancelled before connection
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Call direction enum
DO $$ BEGIN
  CREATE TYPE voip_call_direction AS ENUM ('inbound', 'outbound');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Call provider enum
DO $$ BEGIN
  CREATE TYPE voip_call_provider AS ENUM ('twilio', 'whatsapp', 'sip');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- =====================================================
-- 2. VOIP CONFIG TABLE (Hybrid: Twilio + WhatsApp SIP)
-- =====================================================

CREATE TABLE IF NOT EXISTS voip_config (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- ========== TWILIO CREDENTIALS (for WebRTC Browser) ==========
  twilio_account_sid VARCHAR(255),           -- Twilio Account SID (starts with AC)
  twilio_auth_token VARCHAR(255),            -- Twilio Auth Token
  twilio_api_key_sid VARCHAR(255),           -- Twilio API Key SID (for token generation)
  twilio_api_key_secret VARCHAR(255),        -- Twilio API Key Secret
  twilio_twiml_app_sid VARCHAR(255),         -- TwiML Application SID for voice

  -- ========== WHATSAPP CALLING CONFIG ==========
  whatsapp_phone_number_id VARCHAR(255),     -- WhatsApp Phone Number ID (from Meta)
  whatsapp_business_id VARCHAR(255),         -- WhatsApp Business Account ID
  whatsapp_access_token TEXT,                -- Meta Access Token for API calls
  
  -- ========== SIP TRUNKING CONFIG ==========
  sip_domain VARCHAR(255),                   -- SIP Domain (e.g., dashmedpro.sip.twilio.com)
  sip_username VARCHAR(255),                 -- SIP Username (usually the WA number)
  sip_password VARCHAR(255),                 -- SIP Password (from Meta)
  sip_server_hostname VARCHAR(255),          -- Meta SIP Server hostname

  -- ========== COMMON CONFIG ==========
  display_phone_number VARCHAR(20),          -- Number shown to users (the WA number)
  default_provider voip_call_provider DEFAULT 'whatsapp',
  
  -- Recording Settings
  recording_enabled BOOLEAN DEFAULT true,
  recording_storage_path VARCHAR(255),       -- Path in Supabase Storage

  -- Status
  is_active BOOLEAN DEFAULT false,
  verified_at TIMESTAMPTZ,
  last_synced_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Unique constraint per user
  CONSTRAINT voip_config_user_unique UNIQUE(user_id)
);

-- =====================================================
-- 3. VOIP CALL SESSIONS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS voip_call_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Related entities
  contact_id UUID REFERENCES crm_contacts(id) ON DELETE SET NULL,
  conversation_id UUID REFERENCES whatsapp_conversations(id) ON DELETE SET NULL,

  -- Provider-specific identifiers
  provider voip_call_provider DEFAULT 'whatsapp',
  twilio_call_sid VARCHAR(255),              -- Twilio Call SID (CA...)
  whatsapp_call_id VARCHAR(255),             -- WhatsApp Call ID from webhook
  
  -- Unique constraint on call identifiers
  CONSTRAINT unique_twilio_sid UNIQUE(twilio_call_sid),
  CONSTRAINT unique_whatsapp_call UNIQUE(whatsapp_call_id),

  -- Participants
  from_number VARCHAR(20) NOT NULL,
  to_number VARCHAR(20) NOT NULL,
  contact_name VARCHAR(255),

  -- Call metadata
  direction voip_call_direction NOT NULL,
  status voip_call_status DEFAULT 'initiating',

  -- Timestamps
  initiated_at TIMESTAMPTZ DEFAULT NOW(),
  answered_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,

  -- Duration in seconds
  duration_seconds INTEGER DEFAULT 0,

  -- Recording
  recording_url TEXT,
  recording_duration_seconds INTEGER,
  transcription TEXT,

  -- Notes and errors
  notes TEXT,
  error_code VARCHAR(50),
  error_message TEXT,

  -- Metadata for additional info (WebRTC stats, etc)
  metadata JSONB DEFAULT '{}',

  -- Audit timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 4. INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_voip_config_user ON voip_config(user_id);
CREATE INDEX IF NOT EXISTS idx_voip_config_active ON voip_config(user_id, is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_voip_config_wa_phone ON voip_config(whatsapp_phone_number_id);

CREATE INDEX IF NOT EXISTS idx_voip_sessions_user ON voip_call_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_voip_sessions_contact ON voip_call_sessions(contact_id);
CREATE INDEX IF NOT EXISTS idx_voip_sessions_conversation ON voip_call_sessions(conversation_id);
CREATE INDEX IF NOT EXISTS idx_voip_sessions_status ON voip_call_sessions(status);
CREATE INDEX IF NOT EXISTS idx_voip_sessions_initiated ON voip_call_sessions(initiated_at DESC);
CREATE INDEX IF NOT EXISTS idx_voip_sessions_user_initiated ON voip_call_sessions(user_id, initiated_at DESC);
CREATE INDEX IF NOT EXISTS idx_voip_sessions_twilio_sid ON voip_call_sessions(twilio_call_sid);
CREATE INDEX IF NOT EXISTS idx_voip_sessions_wa_call_id ON voip_call_sessions(whatsapp_call_id);
CREATE INDEX IF NOT EXISTS idx_voip_sessions_provider ON voip_call_sessions(provider);

-- =====================================================
-- 5. RLS POLICIES - voip_config
-- =====================================================

ALTER TABLE voip_config ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for clean re-run)
DROP POLICY IF EXISTS "voip_config_select_own" ON voip_config;
DROP POLICY IF EXISTS "voip_config_insert_own" ON voip_config;
DROP POLICY IF EXISTS "voip_config_update_own" ON voip_config;
DROP POLICY IF EXISTS "voip_config_delete_own" ON voip_config;
DROP POLICY IF EXISTS "voip_config_select_secretary" ON voip_config;

-- Users can view own config
CREATE POLICY "voip_config_select_own"
  ON voip_config FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert own config
CREATE POLICY "voip_config_insert_own"
  ON voip_config FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update own config
CREATE POLICY "voip_config_update_own"
  ON voip_config FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete own config
CREATE POLICY "voip_config_delete_own"
  ON voip_config FOR DELETE
  USING (auth.uid() = user_id);

-- Secretaries can view linked doctors' configs
CREATE POLICY "voip_config_select_secretary"
  ON voip_config FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM secretary_doctor_links sdl
      WHERE sdl.secretary_id = auth.uid()
        AND sdl.doctor_id = voip_config.user_id
        AND sdl.is_active = true
    )
  );

-- =====================================================
-- 6. RLS POLICIES - voip_call_sessions
-- =====================================================

ALTER TABLE voip_call_sessions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "voip_sessions_select_own" ON voip_call_sessions;
DROP POLICY IF EXISTS "voip_sessions_insert_own" ON voip_call_sessions;
DROP POLICY IF EXISTS "voip_sessions_update_own" ON voip_call_sessions;
DROP POLICY IF EXISTS "voip_sessions_select_secretary" ON voip_call_sessions;
DROP POLICY IF EXISTS "voip_sessions_insert_secretary" ON voip_call_sessions;
DROP POLICY IF EXISTS "voip_sessions_update_secretary" ON voip_call_sessions;

-- Users can view own call sessions
CREATE POLICY "voip_sessions_select_own"
  ON voip_call_sessions FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert own call sessions
CREATE POLICY "voip_sessions_insert_own"
  ON voip_call_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update own call sessions
CREATE POLICY "voip_sessions_update_own"
  ON voip_call_sessions FOR UPDATE
  USING (auth.uid() = user_id);

-- Secretaries can view linked doctors' calls
CREATE POLICY "voip_sessions_select_secretary"
  ON voip_call_sessions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM secretary_doctor_links sdl
      WHERE sdl.secretary_id = auth.uid()
        AND sdl.doctor_id = voip_call_sessions.user_id
        AND sdl.is_active = true
    )
  );

-- Secretaries can insert calls on behalf of linked doctors
CREATE POLICY "voip_sessions_insert_secretary"
  ON voip_call_sessions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM secretary_doctor_links sdl
      WHERE sdl.secretary_id = auth.uid()
        AND sdl.doctor_id = voip_call_sessions.user_id
        AND sdl.is_active = true
    )
  );

-- Secretaries can update calls for linked doctors
CREATE POLICY "voip_sessions_update_secretary"
  ON voip_call_sessions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM secretary_doctor_links sdl
      WHERE sdl.secretary_id = auth.uid()
        AND sdl.doctor_id = voip_call_sessions.user_id
        AND sdl.is_active = true
    )
  );

-- =====================================================
-- 7. TRIGGERS
-- =====================================================

-- Auto-update updated_at on voip_config
CREATE OR REPLACE FUNCTION update_voip_config_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_voip_config_updated_at ON voip_config;
CREATE TRIGGER trigger_voip_config_updated_at
  BEFORE UPDATE ON voip_config
  FOR EACH ROW
  EXECUTE FUNCTION update_voip_config_updated_at();

-- Auto-update updated_at on voip_call_sessions
DROP TRIGGER IF EXISTS trigger_voip_sessions_updated_at ON voip_call_sessions;
CREATE TRIGGER trigger_voip_sessions_updated_at
  BEFORE UPDATE ON voip_call_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_voip_config_updated_at();

-- =====================================================
-- 8. COMMENTS
-- =====================================================

COMMENT ON TABLE voip_config IS 'VOIP configuration supporting WhatsApp Cloud API + SIP Trunking + Twilio WebRTC';
COMMENT ON TABLE voip_call_sessions IS 'VOIP call history with recording support';

COMMENT ON COLUMN voip_config.whatsapp_phone_number_id IS 'Phone Number ID from Meta WhatsApp Business API';
COMMENT ON COLUMN voip_config.sip_domain IS 'SIP Domain for routing calls (e.g., from Twilio)';
COMMENT ON COLUMN voip_config.sip_password IS 'SIP Password provided by Meta for voice integration';
COMMENT ON COLUMN voip_config.recording_enabled IS 'Enable call recording (stored in Supabase Storage)';

COMMENT ON COLUMN voip_call_sessions.whatsapp_call_id IS 'Call identifier from WhatsApp Cloud API webhook';
COMMENT ON COLUMN voip_call_sessions.recording_url IS 'URL to the stored call recording';
COMMENT ON COLUMN voip_call_sessions.transcription IS 'AI-generated transcription of the call';
