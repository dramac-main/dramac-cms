-- Phase EM-30: Module Embed Tokens Schema
-- This migration creates the table for storing embed tokens for external embedding

-- Create module_embed_tokens table
CREATE TABLE IF NOT EXISTS module_embed_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL,
  module_id UUID NOT NULL,
  token_hash TEXT NOT NULL,
  is_revoked BOOLEAN DEFAULT FALSE,
  expires_at TIMESTAMPTZ NOT NULL,
  allowed_domains TEXT[] DEFAULT NULL, -- Optional: restrict to specific domains
  usage_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMPTZ DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure one token per site/module combination
  UNIQUE(site_id, module_id)
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_embed_tokens_site ON module_embed_tokens(site_id);
CREATE INDEX IF NOT EXISTS idx_embed_tokens_module ON module_embed_tokens(module_id);
CREATE INDEX IF NOT EXISTS idx_embed_tokens_expires ON module_embed_tokens(expires_at);
CREATE INDEX IF NOT EXISTS idx_embed_tokens_revoked ON module_embed_tokens(is_revoked) WHERE is_revoked = false;

-- Enable Row Level Security
ALTER TABLE module_embed_tokens ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Agency members can manage tokens for their sites
CREATE POLICY "embed_tokens_site_access" ON module_embed_tokens
  FOR ALL USING (
    site_id IN (
      SELECT s.id FROM sites s
      JOIN clients c ON s.client_id = c.id
      JOIN agency_members am ON am.agency_id = c.agency_id
      WHERE am.user_id = auth.uid()
    )
  );

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_embed_tokens_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
DROP TRIGGER IF EXISTS embed_tokens_updated_at ON module_embed_tokens;
CREATE TRIGGER embed_tokens_updated_at
  BEFORE UPDATE ON module_embed_tokens
  FOR EACH ROW
  EXECUTE FUNCTION update_embed_tokens_updated_at();

-- Function to track token usage
CREATE OR REPLACE FUNCTION track_embed_token_usage(
  p_site_id UUID,
  p_module_id UUID
)
RETURNS VOID AS $$
BEGIN
  UPDATE module_embed_tokens
  SET 
    usage_count = usage_count + 1,
    last_used_at = NOW()
  WHERE site_id = p_site_id 
    AND module_id = p_module_id
    AND is_revoked = false
    AND expires_at > NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION track_embed_token_usage(UUID, UUID) TO authenticated;

-- Comments
COMMENT ON TABLE module_embed_tokens IS 'Stores embed tokens for external module embedding';
COMMENT ON COLUMN module_embed_tokens.token_hash IS 'Hashed version of the embed token for security';
COMMENT ON COLUMN module_embed_tokens.is_revoked IS 'Whether the token has been manually revoked';
COMMENT ON COLUMN module_embed_tokens.allowed_domains IS 'Optional array of allowed referrer domains';
COMMENT ON COLUMN module_embed_tokens.usage_count IS 'Number of times the token has been used';
COMMENT ON COLUMN module_embed_tokens.last_used_at IS 'Last time the token was used for embedding';
