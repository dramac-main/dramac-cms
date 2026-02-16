-- ============================================================================
-- URGENT: Run this in Supabase SQL Editor IMMEDIATELY
-- 
-- This creates the pending_purchases table required for domain/email checkout.
-- Without it, checkout fails with: "Could not find the table 'public.pending_purchases'"
--
-- Steps:
-- 1. Go to https://supabase.com/dashboard → Your Project → SQL Editor
-- 2. Click "New query"
-- 3. Paste this entire file
-- 4. Click "Run"
-- 5. Verify: You should see "Success. No rows returned" 
-- ============================================================================

-- Ensure the trigger function exists first
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Create pending_purchases table
-- ============================================================================

CREATE TABLE IF NOT EXISTS pending_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Agency/user context
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  
  -- Purchase type
  purchase_type TEXT NOT NULL CHECK (purchase_type IN ('domain_register', 'domain_renew', 'domain_transfer', 'email_order')),
  
  -- Purchase details (JSONB for flexibility)
  purchase_data JSONB NOT NULL,
  
  -- Pricing
  wholesale_amount DECIMAL(10, 2) NOT NULL,
  retail_amount DECIMAL(10, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  
  -- Paddle transaction
  paddle_transaction_id TEXT UNIQUE,
  paddle_checkout_url TEXT,
  
  -- Status tracking
  status TEXT NOT NULL DEFAULT 'pending_payment' CHECK (status IN (
    'pending_payment',
    'paid',
    'provisioning',
    'completed',
    'failed',
    'cancelled'
  )),
  
  -- Error tracking
  error_message TEXT,
  error_details JSONB,
  retry_count INTEGER DEFAULT 0,
  last_retry_at TIMESTAMPTZ,
  
  -- Idempotency
  idempotency_key TEXT UNIQUE NOT NULL,
  
  -- Provisioning result
  resellerclub_order_id TEXT,
  provisioned_resource_id UUID,
  provisioned_at TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '24 hours')
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_pending_purchases_agency ON pending_purchases(agency_id);
CREATE INDEX IF NOT EXISTS idx_pending_purchases_user ON pending_purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_pending_purchases_status ON pending_purchases(status);
CREATE INDEX IF NOT EXISTS idx_pending_purchases_paddle_txn ON pending_purchases(paddle_transaction_id);
CREATE INDEX IF NOT EXISTS idx_pending_purchases_idempotency ON pending_purchases(idempotency_key);
CREATE INDEX IF NOT EXISTS idx_pending_purchases_expires ON pending_purchases(expires_at);
CREATE INDEX IF NOT EXISTS idx_pending_purchases_created ON pending_purchases(created_at DESC);

-- ============================================================================
-- RLS Policies
-- ============================================================================

ALTER TABLE pending_purchases ENABLE ROW LEVEL SECURITY;

-- Users can view their own pending purchases (needed by status polling API)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Users can view own pending purchases' AND tablename = 'pending_purchases'
  ) THEN
    CREATE POLICY "Users can view own pending purchases" ON pending_purchases
      FOR SELECT USING (
        user_id = auth.uid()
        OR agency_id IN (
          SELECT agency_id FROM profiles WHERE id = auth.uid()
        )
      );
  END IF;
END $$;

-- Users can create pending purchases for their agency
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Users can create pending purchases' AND tablename = 'pending_purchases'
  ) THEN
    CREATE POLICY "Users can create pending purchases" ON pending_purchases
      FOR INSERT WITH CHECK (
        agency_id IN (
          SELECT agency_id FROM profiles WHERE id = auth.uid()
        )
      );
  END IF;
END $$;

-- Service role full access (for admin client operations)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Service role full access pending purchases' AND tablename = 'pending_purchases'
  ) THEN
    CREATE POLICY "Service role full access pending purchases" ON pending_purchases
      FOR ALL USING (true);
  END IF;
END $$;

-- ============================================================================
-- Trigger for updated_at
-- ============================================================================

DROP TRIGGER IF EXISTS update_pending_purchases_updated_at ON pending_purchases;
CREATE TRIGGER update_pending_purchases_updated_at
  BEFORE UPDATE ON pending_purchases
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- Extend domain_orders and email_orders with pending purchase reference
-- ============================================================================

ALTER TABLE domain_orders
ADD COLUMN IF NOT EXISTS pending_purchase_id UUID REFERENCES pending_purchases(id) ON DELETE SET NULL;

ALTER TABLE domain_orders
ADD COLUMN IF NOT EXISTS idempotency_key TEXT;

CREATE INDEX IF NOT EXISTS idx_domain_orders_pending_purchase ON domain_orders(pending_purchase_id);
CREATE INDEX IF NOT EXISTS idx_domain_orders_idempotency ON domain_orders(idempotency_key);

ALTER TABLE email_orders
ADD COLUMN IF NOT EXISTS pending_purchase_id UUID REFERENCES pending_purchases(id) ON DELETE SET NULL;

ALTER TABLE email_orders
ADD COLUMN IF NOT EXISTS idempotency_key TEXT;

CREATE INDEX IF NOT EXISTS idx_email_orders_pending_purchase ON email_orders(pending_purchase_id);
CREATE INDEX IF NOT EXISTS idx_email_orders_idempotency ON email_orders(idempotency_key);

-- ============================================================================
-- Helper Functions
-- ============================================================================

CREATE OR REPLACE FUNCTION cleanup_expired_pending_purchases()
RETURNS INTEGER AS $$
DECLARE
  v_deleted_count INTEGER;
BEGIN
  DELETE FROM pending_purchases
  WHERE status = 'pending_payment'
    AND expires_at < now();
  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  RETURN v_deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- Done! The checkout flow should now work.
-- ============================================================================
