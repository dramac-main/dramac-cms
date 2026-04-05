-- ============================================================================
-- LC-11: SECURITY FIX — Prevent internal notes from leaking to widget clients
-- ============================================================================
-- ROOT CAUSE: The chat_messages_widget_read policy (created in lc-09) allowed
-- anonymous (widget) clients to SELECT internal notes via Supabase Realtime.
-- While the widget JS filtered them client-side, the full payload (including
-- note content) was transmitted over WebSocket and visible in browser DevTools.
--
-- FIX 1: Add is_internal_note = false condition to message read policy so that
-- Supabase Realtime never broadcasts internal notes to anonymous clients.
--
-- FIX 2: Tighten conversation read policy from USING (true) to require
-- visitor_id IS NOT NULL (least-privilege — only widget-initiated convos).
--
-- APPLIED: 2026-04-05 via MCP
-- ============================================================================

-- Fix 1: Messages — block internal notes from anonymous SELECT
DROP POLICY IF EXISTS "chat_messages_widget_read" ON mod_chat_messages;

CREATE POLICY "chat_messages_widget_read" ON mod_chat_messages
  FOR SELECT
  USING (
    -- SECURITY: Only non-internal messages visible to anonymous widget clients
    is_internal_note = false
    AND EXISTS (
      SELECT 1 FROM mod_chat_conversations c
      WHERE c.id = mod_chat_messages.conversation_id
      AND c.visitor_id IS NOT NULL
    )
  );

-- Fix 2: Conversations — restrict to widget-initiated conversations only
DROP POLICY IF EXISTS "chat_conversations_widget_read" ON mod_chat_conversations;

CREATE POLICY "chat_conversations_widget_read" ON mod_chat_conversations
  FOR SELECT
  USING (
    -- Only conversations with a visitor can be read by anonymous widget clients
    visitor_id IS NOT NULL
  );
