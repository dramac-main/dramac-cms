-- ============================================================================
-- CHIKO AI — DEFAULT TO NO APPROVAL GATE
-- ============================================================================
-- Reverses the global approval gate introduced earlier. When the platform
-- has a paid Anthropic API key, it is wasteful (and a poor UX) to make every
-- AI-generated reply wait for human approval. Site owners can still opt-in
-- per site if they want pre-publish review.
--
-- Also normalises the assistant display name so the default is always
-- "Chiko" — never "AI Assistant", "Bot", or empty.
--
-- Applied via Supabase MCP on 2026-04-26.
-- ============================================================================

ALTER TABLE mod_chat_widget_settings
  ALTER COLUMN ai_responses_require_approval SET DEFAULT FALSE;
ALTER TABLE mod_chat_widget_settings
  ALTER COLUMN scripted_flows_require_approval SET DEFAULT FALSE;

UPDATE mod_chat_widget_settings
   SET ai_responses_require_approval = FALSE,
       scripted_flows_require_approval = FALSE
 WHERE ai_responses_require_approval IS DISTINCT FROM FALSE
    OR scripted_flows_require_approval IS DISTINCT FROM FALSE;

UPDATE mod_chat_widget_settings
   SET ai_assistant_name = 'Chiko'
 WHERE ai_assistant_name IS NULL
    OR TRIM(ai_assistant_name) = ''
    OR LOWER(TRIM(ai_assistant_name)) IN ('ai', 'ai assistant', 'assistant', 'bot');

ALTER TABLE mod_chat_widget_settings
  ALTER COLUMN ai_assistant_name SET DEFAULT 'Chiko';

COMMENT ON COLUMN mod_chat_widget_settings.ai_responses_require_approval IS
  'When TRUE, every AI-generated chat message is staged as pending_approval. '
  'Default FALSE — customers receive Chiko replies immediately. Site owners '
  'opt-in per site if they want manual review before each customer reply.';
