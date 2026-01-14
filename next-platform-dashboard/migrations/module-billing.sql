-- Add missing columns to module_subscriptions (table created in Phase 29)
-- Note: This is idempotent - columns only added if they don't exist
ALTER TABLE public.module_subscriptions 
  ADD COLUMN IF NOT EXISTS cancel_at_period_end BOOLEAN DEFAULT false;

-- Make stripe_subscription_id unique if not already
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'module_subscriptions' 
    AND indexname = 'module_subscriptions_stripe_subscription_id_key'
  ) THEN
    ALTER TABLE public.module_subscriptions 
      ADD CONSTRAINT module_subscriptions_stripe_subscription_id_key UNIQUE (stripe_subscription_id);
  END IF;
END $$;

-- Add Stripe columns to modules table
ALTER TABLE public.modules ADD COLUMN IF NOT EXISTS stripe_product_id TEXT;
ALTER TABLE public.modules ADD COLUMN IF NOT EXISTS stripe_price_monthly TEXT;
ALTER TABLE public.modules ADD COLUMN IF NOT EXISTS stripe_price_yearly TEXT;

-- Agency modules tracking (purchased modules)
CREATE TABLE IF NOT EXISTS public.agency_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  module_id UUID NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE,
  enabled BOOLEAN DEFAULT true,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(agency_id, module_id)
);

-- RLS for agency_modules (module_subscriptions RLS already defined in Phase 29)
ALTER TABLE public.agency_modules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view agency modules" ON public.agency_modules;
CREATE POLICY "Users can view agency modules"
  ON public.agency_modules FOR SELECT
  USING (
    agency_id IN (
      SELECT agency_id FROM public.agency_members WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Admins can manage agency modules" ON public.agency_modules;
CREATE POLICY "Admins can manage agency modules"
  ON public.agency_modules FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.agency_members 
      WHERE user_id = auth.uid() 
      AND agency_id = agency_modules.agency_id
      AND role IN ('owner', 'admin')
    )
  );

-- Indexes
CREATE INDEX IF NOT EXISTS idx_agency_modules_agency ON public.agency_modules(agency_id);
