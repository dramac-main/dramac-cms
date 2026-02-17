-- ============================================================================
-- DM-12b: Add refund tracking columns to pending_purchases
-- ============================================================================
-- Description: Adds columns needed for auto-refund tracking when provisioning fails
-- Created: February 17, 2026
-- ============================================================================

-- 1) Drop old CHECK constraint and re-create with new status values
ALTER TABLE pending_purchases 
  DROP CONSTRAINT IF EXISTS pending_purchases_status_check;

ALTER TABLE pending_purchases 
  ADD CONSTRAINT pending_purchases_status_check 
  CHECK (status IN (
    'pending_payment',    -- Awaiting payment
    'paid',              -- Paddle payment successful
    'provisioning',      -- Currently provisioning at ResellerClub
    'completed',         -- Successfully provisioned
    'failed',            -- Provisioning failed
    'cancelled',         -- Purchase cancelled
    'refunded',          -- Auto-refund issued via Paddle
    'refund_failed'      -- Auto-refund failed — needs manual intervention
  ));

-- 2) Add refund tracking columns
ALTER TABLE pending_purchases
  ADD COLUMN IF NOT EXISTS refund_reason TEXT,
  ADD COLUMN IF NOT EXISTS paddle_refund_id TEXT,
  ADD COLUMN IF NOT EXISTS refunded_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS needs_manual_refund BOOLEAN DEFAULT FALSE;

-- 3) Comments
COMMENT ON COLUMN pending_purchases.refund_reason IS 
  'Reason for auto-refund (e.g. provisioning failure)';

COMMENT ON COLUMN pending_purchases.paddle_refund_id IS 
  'Paddle Adjustment ID for the refund';

COMMENT ON COLUMN pending_purchases.refunded_at IS 
  'Timestamp when refund was issued';

COMMENT ON COLUMN pending_purchases.needs_manual_refund IS 
  'Flag for purchases where auto-refund failed and manual intervention is needed';
