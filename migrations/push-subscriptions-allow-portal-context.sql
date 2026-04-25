-- Migration: Allow 'portal' context on push_subscriptions
-- Root cause of the "Failed subscription" bug on /portal "Enable for notifications".
-- The original CHECK constraint allowed only ('agent', 'customer'), so portal banner
-- inserts (context = 'portal') failed with 23514 → API returned 500 "Failed to save subscription".

ALTER TABLE push_subscriptions
  DROP CONSTRAINT IF EXISTS push_subscriptions_context_check;

ALTER TABLE push_subscriptions
  ADD CONSTRAINT push_subscriptions_context_check
  CHECK (context IN ('agent', 'customer', 'portal'));
