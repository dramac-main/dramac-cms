-- Migration: Web Push Subscriptions
-- Creates the push_subscriptions table for browser push notification support
-- Supports both agent (authenticated) and customer (anonymous widget) subscriptions

-- Create push_subscriptions table
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  endpoint TEXT NOT NULL UNIQUE,
  p256dh TEXT NOT NULL DEFAULT '',
  auth TEXT NOT NULL DEFAULT '',
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  context TEXT NOT NULL DEFAULT 'agent' CHECK (context IN ('agent', 'customer')),
  site_id UUID REFERENCES sites(id) ON DELETE CASCADE,
  conversation_id UUID,
  user_agent TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_push_subs_user_id ON push_subscriptions(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_push_subs_conversation ON push_subscriptions(conversation_id) WHERE conversation_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_push_subs_context ON push_subscriptions(context);
CREATE INDEX IF NOT EXISTS idx_push_subs_site ON push_subscriptions(site_id) WHERE site_id IS NOT NULL;

-- RLS
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Agents can manage their own subscriptions
CREATE POLICY "Users can manage own push subscriptions"
  ON push_subscriptions FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Anonymous users (customers) can insert subscriptions (no auth required for widget)
CREATE POLICY "Anonymous can insert push subscriptions"
  ON push_subscriptions FOR INSERT
  TO anon
  WITH CHECK (context = 'customer');

-- Service role can manage all subscriptions (for sending push from server)
CREATE POLICY "Service role full access to push subscriptions"
  ON push_subscriptions FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Add push notification preference to notification_preferences if not exists
DO $$
BEGIN
  -- Check if push_enabled column exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'notification_preferences'
    AND column_name = 'push_enabled'
  ) THEN
    ALTER TABLE notification_preferences ADD COLUMN push_enabled BOOLEAN DEFAULT true;
  END IF;
END $$;

-- Clean up stale subscriptions (older than 30 days without update)
CREATE OR REPLACE FUNCTION cleanup_stale_push_subscriptions()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM push_subscriptions
  WHERE updated_at < NOW() - INTERVAL '30 days';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
