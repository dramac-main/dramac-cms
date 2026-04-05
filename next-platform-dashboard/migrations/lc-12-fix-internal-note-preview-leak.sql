-- ============================================================================
-- LC-12: Fix internal note content leaking into conversation preview
-- ============================================================================
-- ROOT CAUSE: The update_conversation_message_count() trigger fires on ALL
-- message inserts and unconditionally overwrites last_message_text,
-- last_message_at, and last_message_by. When an agent sends an internal note,
-- the note content becomes the conversation preview visible to customers.
--
-- Additionally, internal notes were incrementing unread_visitor_count, causing
-- false unread badge counts on the customer's widget.
--
-- FIX: Add CASE checks to preserve existing preview/timestamp/sender when the
-- new message is an internal note. Also skip unread_visitor_count for notes.
--
-- APPLIED: 2026-04-06 via MCP
-- ============================================================================

CREATE OR REPLACE FUNCTION update_conversation_message_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE mod_chat_conversations
  SET
    message_count = message_count + 1,
    -- Only update preview for non-internal messages
    last_message_text = CASE
      WHEN NEW.is_internal_note = true THEN last_message_text
      ELSE NEW.content
    END,
    last_message_at = CASE
      WHEN NEW.is_internal_note = true THEN last_message_at
      ELSE NEW.created_at
    END,
    last_message_by = CASE
      WHEN NEW.is_internal_note = true THEN last_message_by
      ELSE NEW.sender_type
    END,
    -- Visitor unread count should NOT increment for internal notes
    unread_agent_count = CASE
      WHEN NEW.sender_type = 'visitor' THEN unread_agent_count + 1
      ELSE unread_agent_count
    END,
    unread_visitor_count = CASE
      WHEN NEW.sender_type IN ('agent', 'ai') AND NEW.is_internal_note = false
        THEN unread_visitor_count + 1
      ELSE unread_visitor_count
    END
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
