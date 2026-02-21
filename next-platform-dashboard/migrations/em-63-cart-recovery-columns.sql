-- ============================================================================
-- Abandoned Cart Recovery Columns
-- Phase ECOM-61: Abandoned Cart Recovery
-- ============================================================================

-- Add recovery tracking columns to carts table
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'mod_ecommod01_carts' AND column_name = 'recovery_email_sent_at'
  ) THEN
    ALTER TABLE mod_ecommod01_carts ADD COLUMN recovery_email_sent_at TIMESTAMPTZ;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'mod_ecommod01_carts' AND column_name = 'recovery_email_count'
  ) THEN
    ALTER TABLE mod_ecommod01_carts ADD COLUMN recovery_email_count INTEGER DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'mod_ecommod01_carts' AND column_name = 'recovery_token'
  ) THEN
    ALTER TABLE mod_ecommod01_carts ADD COLUMN recovery_token UUID;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'mod_ecommod01_carts' AND column_name = 'customer_email'
  ) THEN
    ALTER TABLE mod_ecommod01_carts ADD COLUMN customer_email TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'mod_ecommod01_carts' AND column_name = 'customer_name'
  ) THEN
    ALTER TABLE mod_ecommod01_carts ADD COLUMN customer_name TEXT;
  END IF;
END $$;

-- Index for recovery token lookups
CREATE INDEX IF NOT EXISTS idx_carts_recovery_token ON mod_ecommod01_carts(recovery_token);

-- Index for abandoned cart queries
CREATE INDEX IF NOT EXISTS idx_carts_status_updated ON mod_ecommod01_carts(status, updated_at);
