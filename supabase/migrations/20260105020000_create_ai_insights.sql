-- Migration: Create AI Insights tables
-- Purpose: Store AI-generated insights for CRM analysis

-- AI Insights table
CREATE TABLE IF NOT EXISTS crm_ai_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Insight content
  category TEXT NOT NULL CHECK (category IN ('conversion', 'messages', 'scheduling', 'leads', 'operational', 'financial')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  
  -- Metadata
  impact TEXT CHECK (impact IN ('high', 'medium', 'low')) DEFAULT 'medium',
  trend TEXT CHECK (trend IN ('improving', 'declining', 'stable')),
  data_sources TEXT[] DEFAULT '{}',
  confidence NUMERIC(3,2) CHECK (confidence >= 0 AND confidence <= 1),
  
  -- Status
  is_actionable BOOLEAN DEFAULT true,
  is_applied BOOLEAN DEFAULT false,
  applied_at TIMESTAMPTZ,
  
  -- Timestamps
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '24 hours'),
  
  -- Analysis batch reference
  analysis_batch_id UUID
);

-- Analysis batches table (for grouping insights from same analysis)
CREATE TABLE IF NOT EXISTS crm_ai_analysis_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  status TEXT CHECK (status IN ('pending', 'processing', 'completed', 'failed')) DEFAULT 'pending',
  insights_count INTEGER DEFAULT 0,
  processing_time_ms INTEGER,
  error_message TEXT,
  data_summary JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_ai_insights_user_id ON crm_ai_insights(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_insights_category ON crm_ai_insights(category);
CREATE INDEX IF NOT EXISTS idx_ai_insights_expires_at ON crm_ai_insights(expires_at);
CREATE INDEX IF NOT EXISTS idx_ai_insights_batch ON crm_ai_insights(analysis_batch_id);
CREATE INDEX IF NOT EXISTS idx_ai_analysis_batches_user ON crm_ai_analysis_batches(user_id);

-- RLS Policies
ALTER TABLE crm_ai_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_ai_analysis_batches ENABLE ROW LEVEL SECURITY;

-- crm_ai_insights policies
CREATE POLICY "Users can view own insights"
  ON crm_ai_insights FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own insights"
  ON crm_ai_insights FOR UPDATE
  USING (auth.uid() = user_id);

-- crm_ai_analysis_batches policies
CREATE POLICY "Users can view own analysis batches"
  ON crm_ai_analysis_batches FOR SELECT
  USING (auth.uid() = user_id);

-- Service role can do everything (for edge functions)
CREATE POLICY "Service role full access insights"
  ON crm_ai_insights FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access batches"
  ON crm_ai_analysis_batches FOR ALL
  USING (auth.role() = 'service_role');

-- Function to clean expired insights
CREATE OR REPLACE FUNCTION cleanup_expired_ai_insights()
RETURNS void AS $$
BEGIN
  DELETE FROM crm_ai_insights WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comment for documentation
COMMENT ON TABLE crm_ai_insights IS 'AI-generated insights about CRM data';
COMMENT ON TABLE crm_ai_analysis_batches IS 'Tracks analysis runs and their status';
