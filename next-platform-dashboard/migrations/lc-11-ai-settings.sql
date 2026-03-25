-- ============================================================================
-- PHASE LC-11: AI Auto-Response Settings
--
-- Adds site-owner-controllable AI settings to mod_chat_widget_settings.
-- These allow site owners to toggle AI behavior from the dashboard.
-- ============================================================================

-- AI auto-response toggle (general AI responses when no agent is available)
ALTER TABLE mod_chat_widget_settings
  ADD COLUMN IF NOT EXISTS ai_auto_response_enabled BOOLEAN DEFAULT true;

-- AI payment guidance toggle (AI responds with payment instructions after checkout)
ALTER TABLE mod_chat_widget_settings
  ADD COLUMN IF NOT EXISTS ai_payment_guidance_enabled BOOLEAN DEFAULT true;

-- Custom AI greeting for payment conversations (optional override)
ALTER TABLE mod_chat_widget_settings
  ADD COLUMN IF NOT EXISTS ai_payment_greeting TEXT DEFAULT NULL;

-- AI confidence threshold — below this, AI hands off to human agent
ALTER TABLE mod_chat_widget_settings
  ADD COLUMN IF NOT EXISTS ai_confidence_threshold NUMERIC(3,2) DEFAULT 0.7;
