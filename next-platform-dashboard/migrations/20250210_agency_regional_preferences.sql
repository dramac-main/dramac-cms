-- Phase FIX-01 Task 4: Add regional preference columns to agencies table
-- Enables per-agency currency, locale, timezone, tax, and unit settings

ALTER TABLE agencies ADD COLUMN IF NOT EXISTS default_currency TEXT NOT NULL DEFAULT 'ZMW';
ALTER TABLE agencies ADD COLUMN IF NOT EXISTS default_locale TEXT NOT NULL DEFAULT 'en-ZM';
ALTER TABLE agencies ADD COLUMN IF NOT EXISTS default_timezone TEXT NOT NULL DEFAULT 'Africa/Lusaka';
ALTER TABLE agencies ADD COLUMN IF NOT EXISTS date_format TEXT NOT NULL DEFAULT 'DD/MM/YYYY';
ALTER TABLE agencies ADD COLUMN IF NOT EXISTS tax_rate NUMERIC(5,2) NOT NULL DEFAULT 16.00;
ALTER TABLE agencies ADD COLUMN IF NOT EXISTS tax_inclusive BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE agencies ADD COLUMN IF NOT EXISTS weight_unit TEXT NOT NULL DEFAULT 'kg';
ALTER TABLE agencies ADD COLUMN IF NOT EXISTS dimension_unit TEXT NOT NULL DEFAULT 'cm';

-- After running this migration, regenerate types:
-- npx supabase gen types typescript --project-id <id> > src/types/database.types.ts
