-- =============================================================================
-- PORTAL: Scripted Flows for Live Chat — Section 3 of Client Portal Perfection
-- =============================================================================
-- Adds a deterministic, AI-independent scripted-flow library used as the chat
-- fallback when AI is disabled or rate-limited. Site owners can author flows
-- that run via keyword triggers and step over messages, choice buttons, and
-- handoff to a human.
--
-- Companion: src/modules/live-chat/lib/scripted-flows.ts
-- =============================================================================

-- 1. Widget settings — scripted flow toggles
ALTER TABLE mod_chat_widget_settings
  ADD COLUMN IF NOT EXISTS scripted_flows_enabled BOOLEAN NOT NULL DEFAULT TRUE;

ALTER TABLE mod_chat_widget_settings
  ADD COLUMN IF NOT EXISTS scripted_flows_require_approval BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE mod_chat_widget_settings
  ADD COLUMN IF NOT EXISTS scripted_flows_fallback_priority INTEGER NOT NULL DEFAULT 1; -- 0 = always, 1 = when AI off

-- 2. Scripted flows table
CREATE TABLE IF NOT EXISTS mod_chat_scripted_flows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  slug TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  trigger_keywords TEXT[] NOT NULL DEFAULT '{}',
  trigger_intents TEXT[] NOT NULL DEFAULT '{}',
  is_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  priority INTEGER NOT NULL DEFAULT 100,
  steps JSONB NOT NULL DEFAULT '[]'::jsonb,
  -- analytics
  usage_count INTEGER NOT NULL DEFAULT 0,
  completion_count INTEGER NOT NULL DEFAULT 0,
  handoff_count INTEGER NOT NULL DEFAULT 0,
  last_triggered_at TIMESTAMPTZ,
  --
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(site_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_scripted_flows_site_enabled
  ON mod_chat_scripted_flows(site_id, is_enabled);
CREATE INDEX IF NOT EXISTS idx_scripted_flows_priority
  ON mod_chat_scripted_flows(site_id, priority DESC);

CREATE OR REPLACE TRIGGER update_scripted_flows_updated_at
  BEFORE UPDATE ON mod_chat_scripted_flows
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 3. RLS
ALTER TABLE mod_chat_scripted_flows ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "scripted_flows_site_isolation" ON mod_chat_scripted_flows;
CREATE POLICY "scripted_flows_site_isolation" ON mod_chat_scripted_flows
  FOR ALL USING (
    site_id IN (
      SELECT s.id FROM sites s
      JOIN agency_members am ON am.agency_id = s.agency_id
      WHERE am.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "scripted_flows_portal_select" ON mod_chat_scripted_flows;
CREATE POLICY "scripted_flows_portal_select" ON mod_chat_scripted_flows
  FOR SELECT USING (public.is_portal_user_for_site(site_id));

-- Public read for the widget runtime (anonymous visitors)
DROP POLICY IF EXISTS "scripted_flows_public_read_enabled" ON mod_chat_scripted_flows;
CREATE POLICY "scripted_flows_public_read_enabled" ON mod_chat_scripted_flows
  FOR SELECT USING (is_enabled = TRUE);

-- 4. Extend message content_type CHECK to support scripted flow message types
ALTER TABLE mod_chat_messages DROP CONSTRAINT IF EXISTS mod_chat_messages_content_type_check;
ALTER TABLE mod_chat_messages ADD CONSTRAINT mod_chat_messages_content_type_check
  CHECK (content_type IN (
    'text', 'image', 'file', 'audio', 'video', 'location',
    'system', 'note', 'whatsapp_template',
    'payment_method_select', 'payment_upload_prompt',
    'flow_choice', 'flow_handoff'
  ));

-- 5. Helper view: enabled flows per site sorted by priority
CREATE OR REPLACE VIEW mod_chat_scripted_flows_active AS
  SELECT * FROM mod_chat_scripted_flows
  WHERE is_enabled = TRUE
  ORDER BY priority DESC, created_at ASC;
