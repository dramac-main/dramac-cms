-- ============================================================================
-- INVFIX-04/05: Payment Settings + Receipt Number + Recurring Columns
-- ============================================================================
-- Adds manual-collection payment settings to mod_invmod01_settings
-- Drops obsolete Stripe columns from settings
-- Adds receipt_number column to mod_invmod01_payments with unique constraint
-- Adds processing_started_at + notify_before_generation to recurring table
-- Creates RPC functions for atomic payment/receipt number generation
-- ============================================================================
-- NOTE: This module uses manual collection ONLY (bank transfer, mobile money,
-- cash, cheque, other). NO Stripe or online payment gateway columns.
-- ============================================================================

-- ── Settings: drop obsolete Stripe columns ───────────────────────────────

ALTER TABLE mod_invmod01_settings DROP COLUMN IF EXISTS stripe_enabled;
ALTER TABLE mod_invmod01_settings DROP COLUMN IF EXISTS stripe_publishable_key;

-- ── Settings: manual-collection payment columns ──────────────────────────

ALTER TABLE mod_invmod01_settings
  ADD COLUMN IF NOT EXISTS online_payment_enabled BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS payment_instructions TEXT,
  ADD COLUMN IF NOT EXISTS bank_transfer_instructions TEXT,
  ADD COLUMN IF NOT EXISTS mobile_money_instructions TEXT;

-- ── Payments: dedicated receipt_number column ────────────────────────────

ALTER TABLE mod_invmod01_payments
  ADD COLUMN IF NOT EXISTS receipt_number TEXT;

-- Unique constraints for concurrency safety
CREATE UNIQUE INDEX IF NOT EXISTS idx_invmod01_payments_unique_pay_num
  ON mod_invmod01_payments (site_id, payment_number);

CREATE UNIQUE INDEX IF NOT EXISTS idx_invmod01_payments_unique_rct_num
  ON mod_invmod01_payments (site_id, receipt_number)
  WHERE receipt_number IS NOT NULL;

-- Index for receipt number lookups
CREATE INDEX IF NOT EXISTS idx_invmod01_payments_receipt_number
  ON mod_invmod01_payments (receipt_number)
  WHERE receipt_number IS NOT NULL;

-- Backfill existing payments with receipt numbers
UPDATE mod_invmod01_payments
SET receipt_number = REPLACE(payment_number, 'PAY-', 'RCT-')
WHERE receipt_number IS NULL
  AND payment_number IS NOT NULL
  AND type = 'payment';

-- ── Recurring Invoices: processing_started_at for cron lock ──────────────

ALTER TABLE mod_invmod01_recurring_invoices
  ADD COLUMN IF NOT EXISTS processing_started_at TIMESTAMPTZ;

-- ── Recurring Invoices: notify_before_generation preference ──────────────

ALTER TABLE mod_invmod01_recurring_invoices
  ADD COLUMN IF NOT EXISTS notify_before_generation BOOLEAN DEFAULT FALSE;

-- ── RPC: Atomic payment number generation ────────────────────────────────

CREATE OR REPLACE FUNCTION generate_invmod01_payment_number(p_site_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  v_year TEXT := extract(year FROM now())::TEXT;
  v_prefix TEXT := 'PAY-' || v_year || '-';
  v_max_seq INT;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtext('invmod01_pay_' || p_site_id::TEXT || '_' || v_year));

  SELECT COALESCE(MAX(
    (regexp_match(payment_number, 'PAY-\d{4}-(\d+)'))[1]::INT
  ), 0) + 1
  INTO v_max_seq
  FROM mod_invmod01_payments
  WHERE site_id = p_site_id
    AND payment_number LIKE v_prefix || '%';

  RETURN v_prefix || lpad(v_max_seq::TEXT, 4, '0');
END;
$$;

-- ── RPC: Atomic receipt number generation ────────────────────────────────

CREATE OR REPLACE FUNCTION generate_invmod01_receipt_number(p_site_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  v_year TEXT := extract(year FROM now())::TEXT;
  v_prefix TEXT := 'RCT-' || v_year || '-';
  v_max_seq INT;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtext('invmod01_rct_' || p_site_id::TEXT || '_' || v_year));

  SELECT COALESCE(MAX(
    (regexp_match(receipt_number, 'RCT-\d{4}-(\d+)'))[1]::INT
  ), 0) + 1
  INTO v_max_seq
  FROM mod_invmod01_payments
  WHERE site_id = p_site_id
    AND receipt_number LIKE v_prefix || '%';

  RETURN v_prefix || lpad(v_max_seq::TEXT, 4, '0');
END;
$$;
