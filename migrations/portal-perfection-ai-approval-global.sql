-- ============================================================================
-- PORTAL PERFECTION — GLOBAL AI APPROVAL GATE
-- ============================================================================
-- All AI-generated chat messages (free-form AI replies, payment-guidance
-- prompts, scripted-flow steps, proactive entity greetings) MUST be approved
-- by a human agent before reaching the customer, on EVERY tenant / site.
--
-- This migration:
--   1. Adds `ai_responses_require_approval` column (default TRUE) to
--      `mod_chat_widget_settings`.
--   2. Flips the default of `scripted_flows_require_approval` to TRUE.
--   3. Force-enables both flags on every existing site so the gate is
--      retroactively active across the entire platform.
--
-- Site owners who want fully autonomous AI can opt out per-site by setting
-- either flag to FALSE in their dashboard.
-- ============================================================================

-- 1. New column for free-form AI / payment-guidance approval gate -----------
ALTER TABLE mod_chat_widget_settings
  ADD COLUMN IF NOT EXISTS ai_responses_require_approval BOOLEAN
    NOT NULL DEFAULT TRUE;

COMMENT ON COLUMN mod_chat_widget_settings.ai_responses_require_approval IS
  'When TRUE (default), every AI-generated chat message is staged as '
  'pending_approval and must be reviewed by a human agent before being '
  'visible to the customer.';

-- 2. Make scripted-flow approval the safe default ---------------------------
ALTER TABLE mod_chat_widget_settings
  ALTER COLUMN scripted_flows_require_approval SET DEFAULT TRUE;

-- 3. Retroactively enforce the gate on every existing site ------------------
UPDATE mod_chat_widget_settings
SET
  ai_responses_require_approval = TRUE,
  scripted_flows_require_approval = TRUE
WHERE
  ai_responses_require_approval IS DISTINCT FROM TRUE
  OR scripted_flows_require_approval IS DISTINCT FROM TRUE;
