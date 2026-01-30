-- Migration: Add member_limit to organizations
-- Description: Allows controlling how many additional members each organization can have

-- Add member_limit column (default 1 = only 1 additional member beyond owner)
ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS member_limit INTEGER DEFAULT 1 NOT NULL;

-- Add additional_member_price column (price per additional member)
ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS additional_member_price NUMERIC(10,2) DEFAULT 89.90 NOT NULL;

-- Add owner_id to track who created the organization (doesn't count towards limit)
ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES auth.users(id);

-- Set owner_id for existing organizations (use the first member as owner)
UPDATE organizations o
SET owner_id = (
  SELECT om.user_id
  FROM organization_members om
  WHERE om.organization_id = o.id
  ORDER BY om.joined_at ASC
  LIMIT 1
)
WHERE owner_id IS NULL;

-- Create index for owner lookup
CREATE INDEX IF NOT EXISTS idx_organizations_owner_id ON organizations(owner_id);

-- Comment
COMMENT ON COLUMN organizations.member_limit IS 'Maximum number of additional members (beyond owner) allowed in this organization';
COMMENT ON COLUMN organizations.additional_member_price IS 'Price in BRL for each additional member beyond the limit';
COMMENT ON COLUMN organizations.owner_id IS 'User ID of the organization owner (does not count towards member_limit)';
