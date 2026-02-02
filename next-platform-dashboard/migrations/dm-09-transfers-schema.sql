-- migrations/dm-09-transfers-schema.sql
-- Phase DM-09: Domain Transfers & Automation Tables

-- ============================================================================
-- DOMAIN TRANSFERS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS domain_transfers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  domain_id UUID REFERENCES domains(id) ON DELETE SET NULL,
  
  -- Transfer Details
  domain_name TEXT NOT NULL,
  transfer_type TEXT NOT NULL CHECK (transfer_type IN ('in', 'out')),
  resellerclub_order_id TEXT,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending',
    'awaiting-auth',
    'auth-submitted',
    'in-progress',
    'completed',
    'failed',
    'cancelled'
  )),
  current_step INTEGER DEFAULT 1,
  total_steps INTEGER DEFAULT 5,
  
  -- Details
  auth_code_encrypted TEXT, -- Encrypted auth code
  failure_reason TEXT,
  
  -- Contacts for transfer-in
  registrant_contact_id TEXT,
  admin_contact_id TEXT,
  tech_contact_id TEXT,
  billing_contact_id TEXT,
  
  -- Timestamps
  initiated_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_domain_transfers_agency ON domain_transfers(agency_id);
CREATE INDEX IF NOT EXISTS idx_domain_transfers_domain ON domain_transfers(domain_id);
CREATE INDEX IF NOT EXISTS idx_domain_transfers_status ON domain_transfers(status);

-- ============================================================================
-- DOMAIN HEALTH CHECKS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS domain_health_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domain_id UUID NOT NULL REFERENCES domains(id) ON DELETE CASCADE,
  
  -- Health Status
  dns_healthy BOOLEAN DEFAULT false,
  ssl_healthy BOOLEAN DEFAULT false,
  nameservers_correct BOOLEAN DEFAULT false,
  whois_accessible BOOLEAN DEFAULT false,
  
  -- Details
  dns_issues JSONB DEFAULT '[]',
  ssl_issues JSONB DEFAULT '[]',
  
  -- Last Check
  last_checked_at TIMESTAMPTZ DEFAULT now(),
  next_check_at TIMESTAMPTZ DEFAULT now() + INTERVAL '24 hours'
);

-- Index
CREATE INDEX IF NOT EXISTS idx_domain_health_domain ON domain_health_checks(domain_id);
CREATE INDEX IF NOT EXISTS idx_domain_health_next_check ON domain_health_checks(next_check_at);

-- ============================================================================
-- EXPIRY NOTIFICATIONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS domain_expiry_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domain_id UUID NOT NULL REFERENCES domains(id) ON DELETE CASCADE,
  
  -- Notification Settings
  notify_30_days BOOLEAN DEFAULT true,
  notify_14_days BOOLEAN DEFAULT true,
  notify_7_days BOOLEAN DEFAULT true,
  notify_1_day BOOLEAN DEFAULT true,
  
  -- Notification Status
  notified_30_days_at TIMESTAMPTZ,
  notified_14_days_at TIMESTAMPTZ,
  notified_7_days_at TIMESTAMPTZ,
  notified_1_day_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index
CREATE UNIQUE INDEX IF NOT EXISTS idx_domain_expiry_notifications_domain ON domain_expiry_notifications(domain_id);

-- ============================================================================
-- ADD AUTO-RENEW SETTINGS TO DOMAINS TABLE
-- ============================================================================

ALTER TABLE domains ADD COLUMN IF NOT EXISTS auto_renew_enabled BOOLEAN DEFAULT true;
ALTER TABLE domains ADD COLUMN IF NOT EXISTS auto_renew_days_before INTEGER DEFAULT 14;
ALTER TABLE domains ADD COLUMN IF NOT EXISTS last_health_check_at TIMESTAMPTZ;
ALTER TABLE domains ADD COLUMN IF NOT EXISTS health_status TEXT DEFAULT 'unknown';

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE domain_transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE domain_health_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE domain_expiry_notifications ENABLE ROW LEVEL SECURITY;

-- Transfers RLS
DROP POLICY IF EXISTS "Users can view transfers for their agency" ON domain_transfers;
CREATE POLICY "Users can view transfers for their agency"
  ON domain_transfers FOR SELECT
  USING (
    agency_id IN (
      SELECT agency_id FROM profiles WHERE id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can create transfers for their agency" ON domain_transfers;
CREATE POLICY "Users can create transfers for their agency"
  ON domain_transfers FOR INSERT
  WITH CHECK (
    agency_id IN (
      SELECT agency_id FROM profiles WHERE id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can update transfers for their agency" ON domain_transfers;
CREATE POLICY "Users can update transfers for their agency"
  ON domain_transfers FOR UPDATE
  USING (
    agency_id IN (
      SELECT agency_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Health Checks RLS (based on domain ownership)
DROP POLICY IF EXISTS "Users can view health checks for their domains" ON domain_health_checks;
CREATE POLICY "Users can view health checks for their domains"
  ON domain_health_checks FOR SELECT
  USING (
    domain_id IN (
      SELECT id FROM domains WHERE agency_id IN (
        SELECT agency_id FROM profiles WHERE id = auth.uid()
      )
    )
  );

DROP POLICY IF EXISTS "Users can manage health checks for their domains" ON domain_health_checks;
CREATE POLICY "Users can manage health checks for their domains"
  ON domain_health_checks FOR ALL
  USING (
    domain_id IN (
      SELECT id FROM domains WHERE agency_id IN (
        SELECT agency_id FROM profiles WHERE id = auth.uid()
      )
    )
  );

-- Expiry Notifications RLS
DROP POLICY IF EXISTS "Users can view expiry notifications for their domains" ON domain_expiry_notifications;
CREATE POLICY "Users can view expiry notifications for their domains"
  ON domain_expiry_notifications FOR SELECT
  USING (
    domain_id IN (
      SELECT id FROM domains WHERE agency_id IN (
        SELECT agency_id FROM profiles WHERE id = auth.uid()
      )
    )
  );

DROP POLICY IF EXISTS "Users can manage expiry notifications for their domains" ON domain_expiry_notifications;
CREATE POLICY "Users can manage expiry notifications for their domains"
  ON domain_expiry_notifications FOR ALL
  USING (
    domain_id IN (
      SELECT id FROM domains WHERE agency_id IN (
        SELECT agency_id FROM profiles WHERE id = auth.uid()
      )
    )
  );
