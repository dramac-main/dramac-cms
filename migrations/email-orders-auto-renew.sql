-- Add auto-renewal columns to email_orders table
-- Applied via Supabase MCP on 2025-07-15

ALTER TABLE email_orders
  ADD COLUMN IF NOT EXISTS auto_renew BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS auto_renew_months INTEGER NOT NULL DEFAULT 12;

COMMENT ON COLUMN email_orders.auto_renew IS 'Whether this email order auto-renews before expiry';
COMMENT ON COLUMN email_orders.auto_renew_months IS 'Number of months to renew for when auto-renewing';
