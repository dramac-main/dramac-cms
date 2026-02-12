-- ============================================================================
-- NOTIFICATION REALTIME + CHAT AUTO-CLOSE + AGENT MENTIONS
-- Run in Supabase SQL Editor
--
-- 1. Enable Realtime on notifications table
-- 2. Add auto-close settings to chat widget settings
-- 3. Add agent mention tracking to chat messages
-- 4. Create scheduled function to auto-close stale conversations
-- ============================================================================

-- ─── 1. Enable Realtime on notifications table ───────────────────────────────

-- Ensure notifications table has REPLICA IDENTITY FULL for realtime UPDATE/DELETE payloads
ALTER TABLE notifications REPLICA IDENTITY FULL;

-- Add to supabase_realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

-- ─── 2. Auto-close settings for chat widget ──────────────────────────────────

-- Add auto-close columns to chat widget settings
ALTER TABLE mod_chat_widget_settings
  ADD COLUMN IF NOT EXISTS auto_close_enabled BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS auto_close_minutes INTEGER DEFAULT 30,
  ADD COLUMN IF NOT EXISTS auto_close_message TEXT DEFAULT 'This conversation was automatically closed due to inactivity. Feel free to start a new chat anytime!';

-- ─── 3. Agent mentions in internal notes ─────────────────────────────────────

-- Add mentioned_agent_ids array to chat messages for @mention tracking
ALTER TABLE mod_chat_messages
  ADD COLUMN IF NOT EXISTS mentioned_agent_ids UUID[] DEFAULT '{}';

-- Index for finding messages where an agent is mentioned
CREATE INDEX IF NOT EXISTS idx_chat_messages_mentioned_agents
  ON mod_chat_messages USING GIN (mentioned_agent_ids);

-- ─── 4. Auto-close stale conversations (PostgreSQL function) ─────────────────

-- Function to auto-close conversations with no activity past the threshold
CREATE OR REPLACE FUNCTION auto_close_stale_conversations()
RETURNS INTEGER AS $$
DECLARE
  closed_count INTEGER := 0;
  site_record RECORD;
BEGIN
  -- Loop through each site's settings
  FOR site_record IN
    SELECT
      ws.site_id,
      ws.auto_close_minutes,
      ws.auto_close_message
    FROM mod_chat_widget_settings ws
    WHERE ws.auto_close_enabled = true
      AND ws.auto_close_minutes > 0
  LOOP
    -- Find active conversations with no recent messages
    WITH stale_conversations AS (
      SELECT c.id
      FROM mod_chat_conversations c
      WHERE c.site_id = site_record.site_id
        AND c.status = 'active'
        AND c.updated_at < NOW() - (site_record.auto_close_minutes || ' minutes')::INTERVAL
        -- Double-check: no recent messages either
        AND NOT EXISTS (
          SELECT 1 FROM mod_chat_messages m
          WHERE m.conversation_id = c.id
            AND m.created_at > NOW() - (site_record.auto_close_minutes || ' minutes')::INTERVAL
        )
    )
    -- Close them
    UPDATE mod_chat_conversations
    SET
      status = 'resolved',
      resolved_at = NOW(),
      updated_at = NOW()
    WHERE id IN (SELECT id FROM stale_conversations);

    -- Count how many we closed
    GET DIAGNOSTICS closed_count = closed_count + ROW_COUNT;

    -- Insert system message for each closed conversation
    INSERT INTO mod_chat_messages (
      conversation_id,
      sender_type,
      content,
      content_type,
      is_internal_note
    )
    SELECT
      c.id,
      'system',
      site_record.auto_close_message,
      'text',
      false
    FROM mod_chat_conversations c
    WHERE c.site_id = site_record.site_id
      AND c.status = 'resolved'
      AND c.resolved_at >= NOW() - INTERVAL '5 seconds';
  END LOOP;

  RETURN closed_count;
END;
$$ LANGUAGE plpgsql;

-- ─── 5. Schedule auto-close via pg_cron (if available) ───────────────────────
-- NOTE: pg_cron must be enabled in Supabase Dashboard → Database → Extensions
-- Run every 5 minutes to check for stale conversations

DO $$
BEGIN
  -- Only try if pg_cron extension exists
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    -- Remove existing schedule if any
    PERFORM cron.unschedule('auto-close-stale-chats');
    -- Schedule every 5 minutes
    PERFORM cron.schedule(
      'auto-close-stale-chats',
      '*/5 * * * *',
      'SELECT auto_close_stale_conversations()'
    );
    RAISE NOTICE 'pg_cron schedule created: auto-close-stale-chats (every 5 min)';
  ELSE
    RAISE NOTICE 'pg_cron not available — auto-close must be triggered via Edge Function or external cron';
  END IF;
END $$;

-- ─── Verify ──────────────────────────────────────────────────────────────────

SELECT 'notifications' AS table_name, 'realtime enabled' AS status
UNION ALL
SELECT 'mod_chat_widget_settings', 'auto_close columns added'
UNION ALL
SELECT 'mod_chat_messages', 'mentioned_agent_ids column added';
