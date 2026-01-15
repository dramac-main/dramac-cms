-- Rate limits tracking table
CREATE TABLE IF NOT EXISTS public.rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for efficient queries
CREATE INDEX IF NOT EXISTS idx_rate_limits_user_action ON public.rate_limits(user_id, action_type, created_at DESC);

-- Index for cleanup operations
CREATE INDEX IF NOT EXISTS idx_rate_limits_created_at ON public.rate_limits(created_at);

-- RLS
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users view own rate limits" ON public.rate_limits;
DROP POLICY IF EXISTS "System inserts rate limits" ON public.rate_limits;

-- Users can only see their own rate limits
CREATE POLICY "Users view own rate limits"
  ON public.rate_limits FOR SELECT
  USING (user_id = auth.uid());

-- System can insert rate limits (via service role or authenticated users)
CREATE POLICY "System inserts rate limits"
  ON public.rate_limits FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Cleanup job: Delete records older than 24 hours
-- Run this as a cron job or scheduled function
CREATE OR REPLACE FUNCTION cleanup_rate_limits()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_count integer;
BEGIN
  DELETE FROM public.rate_limits
  WHERE created_at < NOW() - INTERVAL '24 hours';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

-- Grant execute on cleanup function to service role
GRANT EXECUTE ON FUNCTION cleanup_rate_limits() TO service_role;

-- Comment for documentation
COMMENT ON TABLE public.rate_limits IS 'Tracks rate-limited actions per user for API protection';
COMMENT ON COLUMN public.rate_limits.action_type IS 'Type of action: aiGeneration, aiRegeneration, siteCreation, pageCreation, export';
COMMENT ON COLUMN public.rate_limits.metadata IS 'Additional context about the rate-limited action';
