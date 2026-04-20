-- ═══════════════════════════════════════════════════════════════
-- INVFIX-06: PO Receive Tracking + Vendor Enhancement
-- ═══════════════════════════════════════════════════════════════

-- 1. Add receive tracking columns to purchase orders
ALTER TABLE mod_invmod01_purchase_orders
  ADD COLUMN IF NOT EXISTS received_date TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS received_by TEXT;

-- 2. Create PO receipts table for line-item receive tracking
CREATE TABLE IF NOT EXISTS mod_invmod01_po_receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  purchase_order_id UUID NOT NULL REFERENCES mod_invmod01_purchase_orders(id) ON DELETE CASCADE,
  line_index INTEGER NOT NULL,
  received_quantity NUMERIC(10,2) NOT NULL DEFAULT 0,
  received_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  received_by TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Indexes for PO receipts
CREATE INDEX IF NOT EXISTS idx_invmod01_po_receipts_po_id 
  ON mod_invmod01_po_receipts (purchase_order_id);
CREATE INDEX IF NOT EXISTS idx_invmod01_po_receipts_site_id 
  ON mod_invmod01_po_receipts (site_id);

-- 4. RLS for PO receipts
ALTER TABLE mod_invmod01_po_receipts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "po_receipts_site_access" ON mod_invmod01_po_receipts
  FOR ALL USING (
    site_id IN (
      SELECT s.id FROM sites s
      WHERE s.id = mod_invmod01_po_receipts.site_id
    )
  );

-- 5. Vendor enhancement columns
ALTER TABLE mod_invmod01_vendors
  ADD COLUMN IF NOT EXISTS preferred_payment_method TEXT,
  ADD COLUMN IF NOT EXISTS vendor_rating NUMERIC(3,2) DEFAULT 0;
