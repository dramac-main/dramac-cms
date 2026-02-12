-- ============================================================================
-- CHAT AUTO-CLOSE: Manual Trigger
-- 
-- If pg_cron is not available, call this function periodically via:
--   1. Supabase Edge Function (recommended) — set up a cron trigger
--   2. External cron service (e.g., Vercel Cron, GitHub Actions)
--   3. Manually via Supabase Dashboard → SQL Editor
--
-- Usage: SELECT auto_close_stale_conversations();
-- Returns: Number of conversations closed
-- ============================================================================

SELECT auto_close_stale_conversations();
