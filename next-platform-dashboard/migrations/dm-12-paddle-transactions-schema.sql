-- ============================================================================
-- Phase DM-12: Paddle One-Time Transactions for Domains & Email
-- ============================================================================
-- Description: Schema for tracking Paddle transactions for domain/email purchases
-- Created: February 14, 2026
-- ============================================================================

-- ============================================================================
-- Pending purchase tracking (before Paddle payment)
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
    'pending_payment',    -- Awaiting payment
    'paid',              -- Paddle payment successful
    'provisioning',      -- Currently provisioning at ResellerClub
    'completed',         -- Successfully provisioned
    'failed',            -- Provisioning failed
    'cancelled'          -- Purchase cancelled
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
  provisioned_resource_id UUID, -- domain_id or email_order_id
  provisioned_at TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '24 hours') -- Expire unpaid after 24h
);

CREATE INDEX IF NOT EXISTS idx_pending_purchases_agency ON pending_purchases(agency_id);
CREATE INDEX IF NOT EXISTS idx_pending_purchases_user ON pending_purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_pending_purchases_status ON pending_purchases(status);
CREATE INDEX IF NOT EXISTS idx_pending_purchases_paddle_txn ON pending_purchases(paddle_transaction_id);
CREATE INDEX IF NOT EXISTS idx_pending_purchases_idempotency ON pending_purchases(idempotency_key);
CREATE INDEX IF NOT EXISTS idx_pending_purchases_expires ON pending_purchases(expires_at);
CREATE INDEX IF NOT EXISTS idx_pending_purchases_created ON pending_purchases(created_at DESC);

COMMENT ON TABLE pending_purchases IS 
  'Tracks domain/email purchases from request through Paddle payment to ResellerClub provisioning';

COMMENT ON COLUMN pending_purchases.idempotency_key IS 
  'Unique key to prevent duplicate purchases (format: {agency_id}:{purchase_type}:{domain}:{timestamp})';

COMMENT ON COLUMN pending_purchases.purchase_data IS 
  'Purchase-specific data (domain name, years, contacts, email accounts, etc.)';

-- ============================================================================
-- Extend domain_orders and email_orders with pending purchase reference
-- ============================================================================

ALTER TABLE domain_orders
ADD COLUMN IF NOT EXISTS pending_purchase_id UUID REFERENCES pending_purchases(id) ON DELETE SET NULL;

ALTER TABLE domain_orders
ADD COLUMN IF NOT EXISTS idempotency_key TEXT;

CREATE INDEX IF NOT EXISTS idx_domain_orders_pending_purchase ON domain_orders(pending_purchase_id);
CREATE INDEX IF NOT EXISTS idx_domain_orders_idempotency ON domain_orders(idempotency_key);

COMMENT ON COLUMN domain_orders.pending_purchase_id IS 
  'Reference to pending_purchase that created this order';

-- Email orders already have most needed fields, just add pending_purchase ref
ALTER TABLE email_orders
ADD COLUMN IF NOT EXISTS pending_purchase_id UUID REFERENCES pending_purchases(id) ON DELETE SET NULL;

ALTER TABLE email_orders
ADD COLUMN IF NOT EXISTS idempotency_key TEXT;

CREATE INDEX IF NOT EXISTS idx_email_orders_pending_purchase ON email_orders(pending_purchase_id);
CREATE INDEX IF NOT EXISTS idx_email_orders_idempotency ON email_orders(idempotency_key);

COMMENT ON COLUMN email_orders.pending_purchase_id IS 
  'Reference to pending_purchase that created this order';

-- ============================================================================
-- RLS Policies
-- ============================================================================

ALTER TABLE pending_purchases ENABLE ROW LEVEL SECURITY;

-- Users can view their own pending purchases
CREATE POLICY "Users can view own pending purchases" ON pending_purchases
  FOR SELECT USING (
    user_id = auth.uid()
    OR agency_id IN (
      SELECT agency_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Users can create pending purchases for their agency
CREATE POLICY "Users can create pending purchases" ON pending_purchases
  FOR INSERT WITH CHECK (
    agency_id IN (
      SELECT agency_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Service role can manage all pending purchases
CREATE POLICY "Service role can manage pending purchases" ON pending_purchases
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- ============================================================================
-- Triggers
-- ============================================================================

CREATE TRIGGER update_pending_purchases_updated_at
  BEFORE UPDATE ON pending_purchases
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- Helper Functions
-- ============================================================================

-- Function to clean up expired pending purchases
CREATE OR REPLACE FUNCTION cleanup_expired_pending_purchases()
RETURNS INTEGER AS $$
DECLARE
  v_deleted_count INTEGER;
BEGIN
  -- Delete expired pending purchases that are still pending_payment
  DELETE FROM pending_purchases
  WHERE status = 'pending_payment'
    AND expires_at < now();
  
  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  
  RETURN v_deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION cleanup_expired_pending_purchases IS 
  'Clean up expired pending purchases (older than 24 hours and still unpaid)';

-- Function to get purchase status by idempotency key
CREATE OR REPLACE FUNCTION get_purchase_status_by_idempotency(
  p_idempotency_key TEXT
)
RETURNS pending_purchases AS $$
DECLARE
  v_purchase pending_purchases%ROWTYPE;
BEGIN
  SELECT * INTO v_purchase
  FROM pending_purchases
  WHERE idempotency_key = p_idempotency_key;
  
  RETURN v_purchase;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_purchase_status_by_idempotency IS 
  'Get purchase status by idempotency key (for checking duplicate requests)';
