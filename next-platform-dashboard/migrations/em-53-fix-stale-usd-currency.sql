-- ============================================================================
-- Migration: EM-53 Fix Stale USD Currency in Ecommerce Settings
-- ============================================================================
-- 
-- Problem: Sites initialized BEFORE the ZMW currency fix have
-- currency = 'USD' hardcoded in their settings row. The 
-- initializeEcommerceForSite() function only creates settings
-- if they don't exist (INSERT ... IF NOT EXISTS pattern),
-- so existing rows never get updated.
--
-- Fix: Update any ecommerce settings row that still has 'USD'
-- as the currency to 'ZMW' (Zambian Kwacha) which is the
-- correct default for this platform.
--
-- This is safe because:
--   1. No real USD-based stores exist on this platform
--   2. 'USD' was a development default that should never ship
--   3. ZMW is the correct currency for all Zambian sites
-- ============================================================================

UPDATE mod_ecommod01_settings
SET 
  currency = 'ZMW',
  updated_at = NOW()
WHERE currency = 'USD';
