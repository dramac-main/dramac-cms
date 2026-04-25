-- Session 12 fix: applied via MCP on production 2026-04-25.
-- 1) `mod_chat_conversations.source` was missing; ChatEventBridge insert failed (PGRST204).
-- 2) `notifications.dedupe_key` had a partial unique index, which Postgres won't accept for
--    ON CONFLICT inference without specifying the predicate. supabase-js .upsert() can't
--    pass the predicate, so every dispatch threw 42P10. Replaced with a full UNIQUE constraint.

ALTER TABLE public.mod_chat_conversations
  ADD COLUMN IF NOT EXISTS source text;

UPDATE public.mod_chat_conversations
SET source = CASE
  WHEN whatsapp_conversation_id IS NOT NULL THEN 'whatsapp'
  ELSE COALESCE(source, 'widget')
END
WHERE source IS NULL;

DROP INDEX IF EXISTS public.notifications_dedupe_key_unique;

ALTER TABLE public.notifications
  ADD CONSTRAINT notifications_dedupe_key_unique UNIQUE (dedupe_key);
