-- =====================================================
-- E-Commerce Module: Customers Table Column Fixes
-- Adds missing columns referenced by customer-actions.ts
-- =====================================================

-- Add missing columns to customers table
ALTER TABLE mod_ecommod01_customers
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS avatar_url TEXT,
  ADD COLUMN IF NOT EXISTS is_guest BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS email_verified BOOLEAN NOT NULL DEFAULT false;

-- Rename last_order_at to last_order_date if it exists (code expects last_order_date)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'mod_ecommod01_customers' AND column_name = 'last_order_at'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'mod_ecommod01_customers' AND column_name = 'last_order_date'
  ) THEN
    ALTER TABLE mod_ecommod01_customers RENAME COLUMN last_order_at TO last_order_date;
  END IF;
END $$;

-- Add index on user_id for lookups
CREATE INDEX IF NOT EXISTS idx_ecom_customers_user_id 
  ON mod_ecommod01_customers(user_id);
