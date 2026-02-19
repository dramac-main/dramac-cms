-- ============================================================================
-- PHASE ECOM-52B: Add Quotation Mode + Payment Provider to Settings Table
-- ============================================================================
-- Adds the missing columns to mod_ecommod01_settings that were added to
-- the TypeScript EcommerceSettings interface but were never migrated to DB:
--
--   payment_provider    — active gateway selection (flutterwave/pesapal/etc.)
--   manual_payment_instructions — shown at checkout for manual payments
--   store_url           — optional canonical store URL
--   quotation_mode_enabled  — master toggle: converts all purchases to quotes
--   quotation_button_label  — custom text for the "Add to Cart" button in quote mode
--   quotation_redirect_url  — where to send customers after requesting a quote
--   quotation_hide_prices   — optionally mask all prices when in quote mode
-- ============================================================================

-- ---------------------------------------------------------------------------
-- payment_provider — which gateway is currently active for the store
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'mod_ecommod01_settings'
      AND column_name = 'payment_provider'
  ) THEN
    ALTER TABLE mod_ecommod01_settings
    ADD COLUMN payment_provider TEXT
      CHECK (payment_provider IN ('paddle', 'flutterwave', 'pesapal', 'dpo', 'manual'));
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- manual_payment_instructions — free-text shown at checkout for manual pay
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'mod_ecommod01_settings'
      AND column_name = 'manual_payment_instructions'
  ) THEN
    ALTER TABLE mod_ecommod01_settings
    ADD COLUMN manual_payment_instructions TEXT;
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- store_url — canonical URL of the storefront (optional branding/SEO)
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'mod_ecommod01_settings'
      AND column_name = 'store_url'
  ) THEN
    ALTER TABLE mod_ecommod01_settings
    ADD COLUMN store_url TEXT;
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- quotation_mode_enabled — master B2B toggle
-- When true, all "Add to Cart" buttons become "Request a Quote"
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'mod_ecommod01_settings'
      AND column_name = 'quotation_mode_enabled'
  ) THEN
    ALTER TABLE mod_ecommod01_settings
    ADD COLUMN quotation_mode_enabled BOOLEAN NOT NULL DEFAULT false;
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- quotation_button_label — custom CTA text when quotation mode is active
-- e.g. "Get a Price", "Request Quote", "Ask for Quote"
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'mod_ecommod01_settings'
      AND column_name = 'quotation_button_label'
  ) THEN
    ALTER TABLE mod_ecommod01_settings
    ADD COLUMN quotation_button_label TEXT;
    -- NULL means use the platform default: "Request a Quote"
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- quotation_redirect_url — where customer lands after requesting a quote
-- Defaults to /quotes in the application logic when NULL
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'mod_ecommod01_settings'
      AND column_name = 'quotation_redirect_url'
  ) THEN
    ALTER TABLE mod_ecommod01_settings
    ADD COLUMN quotation_redirect_url TEXT;
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- quotation_hide_prices — when true, prices are masked on product cards
-- Customers must request a quote to see pricing (B2B price-on-request mode)
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'mod_ecommod01_settings'
      AND column_name = 'quotation_hide_prices'
  ) THEN
    ALTER TABLE mod_ecommod01_settings
    ADD COLUMN quotation_hide_prices BOOLEAN NOT NULL DEFAULT false;
  END IF;
END $$;

-- ============================================================================
-- UPDATE DEFAULT SETTINGS in auto-setup (applyDefaultEcommerceSettings)
-- All existing rows get sensible defaults (no data change needed since
-- new BOOLEAN columns default to false, TEXT columns default to NULL)
-- ============================================================================

COMMENT ON COLUMN mod_ecommod01_settings.payment_provider IS
  'Active payment gateway. NULL = none configured. One of: paddle, flutterwave, pesapal, dpo, manual';

COMMENT ON COLUMN mod_ecommod01_settings.quotation_mode_enabled IS
  'B2B quotation mode master toggle. When true, all Add-to-Cart becomes Request-a-Quote.';

COMMENT ON COLUMN mod_ecommod01_settings.quotation_button_label IS
  'Custom text for the request-quote CTA button. NULL = use platform default (Request a Quote).';

COMMENT ON COLUMN mod_ecommod01_settings.quotation_hide_prices IS
  'When true AND quotation_mode_enabled is true, all product prices are masked.';
