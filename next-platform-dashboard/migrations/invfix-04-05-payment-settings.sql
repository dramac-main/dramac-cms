-- ============================================================================
-- INVFIX-04/05: Payment Settings + Receipt Number + Recurring Columns
-- ============================================================================
-- Adds manual-collection payment settings to mod_invmod01_settings
-- Adds receipt_number column to mod_invmod01_payments
-- Adds processing_started_at + notify_before_generation to recurring table
-- ============================================================================
-- NOTE: This module uses manual collection ONLY (bank transfer, mobile money,
-- cash, cheque, other). NO Stripe or online payment gateway columns.
-- ============================================================================

-- ── Settings: manual-collection payment columns ──────────────────────────

ALTER TABLE mod_invmod01_settings
  ADD COLUMN IF NOT EXISTS online_payment_enabled BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS payment_instructions TEXT,
  ADD COLUMN IF NOT EXISTS bank_transfer_instructions TEXT,
  ADD COLUMN IF NOT EXISTS mobile_money_instructions TEXT;

-- ── Payments: dedicated receipt_number column ────────────────────────────

ALTER TABLE mod_invmod01_payments
  ADD COLUMN IF NOT EXISTS receipt_number TEXT;

-- Index for receipt number lookups
CREATE INDEX IF NOT EXISTS idx_invmod01_payments_receipt_number
  ON mod_invmod01_payments (receipt_number)
  WHERE receipt_number IS NOT NULL;

-- ── Recurring Invoices: processing_started_at for cron lock ──────────────

ALTER TABLE mod_invmod01_recurring_invoices
  ADD COLUMN IF NOT EXISTS processing_started_at TIMESTAMPTZ;

-- ── Recurring Invoices: notify_before_generation preference ──────────────

ALTER TABLE mod_invmod01_recurring_invoices
  ADD COLUMN IF NOT EXISTS notify_before_generation BOOLEAN DEFAULT FALSE;
