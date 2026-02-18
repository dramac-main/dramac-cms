-- ============================================================================
-- Phase DM-11b: Email Pricing Cache - Add Slab Support
-- ============================================================================
-- Description: Adds account_slab column to email_pricing_cache and fixes
--              constraints to match actual ResellerClub API structure.
--
-- ResellerClub returns email pricing per account slab:
--   { "eeliteus": { "email_account_ranges": {
--       "1-5": { "add": { "1": 0.86, "3": 2.17, ... }, "renew": {...} },
--       "6-25": {...}, "26-49": {...}, "50-200000": {...}
--   }}}
--
-- Previously the cache stored one row per product+months+pricing_type.
-- Now it stores one row per product+months+pricing_type+slab.
--
-- Also fixes:
--   - months CHECK: RC only supports 1, 3, 6, 12 (not 24, 36)
--   - Prices should be nullable (some slabs may only have add OR renew)
-- ============================================================================

-- 1. Add account_slab column
ALTER TABLE email_pricing_cache
ADD COLUMN IF NOT EXISTS account_slab TEXT NOT NULL DEFAULT '1-5';

COMMENT ON COLUMN email_pricing_cache.account_slab IS
  'RC account slab range (e.g. 1-5, 6-25, 26-49, 50-200000)';

-- 2. Make prices nullable (some slabs may only have add or renew data)
ALTER TABLE email_pricing_cache
ALTER COLUMN add_account_price DROP NOT NULL;

ALTER TABLE email_pricing_cache
ALTER COLUMN renew_account_price DROP NOT NULL;

-- 3. Fix months CHECK constraint to only allow RC-supported tenures
--    Drop old constraint (named based on column check syntax)
ALTER TABLE email_pricing_cache
DROP CONSTRAINT IF EXISTS email_pricing_cache_months_check;

ALTER TABLE email_pricing_cache
ADD CONSTRAINT email_pricing_cache_months_check CHECK (months IN (1, 3, 6, 12));

-- 4. Drop old unique constraint and create new one that includes account_slab
ALTER TABLE email_pricing_cache
DROP CONSTRAINT IF EXISTS email_pricing_cache_unique;

ALTER TABLE email_pricing_cache
ADD CONSTRAINT email_pricing_cache_unique UNIQUE (product_key, months, pricing_type, account_slab);

-- 5. Delete any stale rows with months = 24 or 36 (shouldn't exist but clean up)
DELETE FROM email_pricing_cache WHERE months NOT IN (1, 3, 6, 12);

-- 6. Add index for slab lookups
CREATE INDEX IF NOT EXISTS idx_email_pricing_cache_slab ON email_pricing_cache(account_slab);

COMMENT ON TABLE email_pricing_cache IS
  'Cached Business Email (Titan) pricing from ResellerClub eelite APIs, stored per product/slab/tenure/pricing_type';
