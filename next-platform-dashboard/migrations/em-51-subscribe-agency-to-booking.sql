-- =============================================================================
-- Helper: Subscribe Current Agency to Booking Module
-- =============================================================================
-- Run this AFTER em-51-register-booking-module.sql
-- This creates an agency subscription so booking appears in site modules tab
-- =============================================================================

-- Get the booking module ID
DO $$
DECLARE
  v_module_id UUID;
  v_agency_id UUID;
  v_subscription_count INTEGER;
BEGIN
  -- Get booking module ID
  SELECT id INTO v_module_id 
  FROM public.modules_v2 
  WHERE slug = 'booking';
  
  IF v_module_id IS NULL THEN
    RAISE EXCEPTION 'Booking module not found. Run em-51-register-booking-module.sql first';
  END IF;
  
  -- Get first agency (or your specific agency)
  -- Replace this with your actual agency_id if you know it
  SELECT id INTO v_agency_id 
  FROM public.agencies 
  ORDER BY created_at ASC 
  LIMIT 1;
  
  IF v_agency_id IS NULL THEN
    RAISE EXCEPTION 'No agency found. Create an agency first';
  END IF;
  
  -- Check if subscription already exists
  SELECT COUNT(*) INTO v_subscription_count
  FROM public.agency_module_subscriptions
  WHERE agency_id = v_agency_id
    AND module_id = v_module_id;
  
  IF v_subscription_count > 0 THEN
    RAISE NOTICE 'Agency already subscribed to booking module';
  ELSE
    -- Create agency subscription
    INSERT INTO public.agency_module_subscriptions (
      agency_id,
      module_id,
      status,
      billing_cycle,
      markup_type,
      markup_percentage,
      retail_price_monthly_cached,
      retail_price_yearly_cached,
      current_period_start,
      current_period_end
    ) VALUES (
      v_agency_id,
      v_module_id,
      'active',
      'monthly',
      'percentage',
      67, -- 67% markup: $29.99 → $49.99 retail
      4999, -- $49.99/month retail price
      49990, -- $499.90/year retail price
      NOW(),
      NOW() + INTERVAL '1 month'
    );
    
    RAISE NOTICE '✅ Agency subscribed to booking module successfully!';
    RAISE NOTICE 'Agency ID: %', v_agency_id;
    RAISE NOTICE 'Module ID: %', v_module_id;
    RAISE NOTICE 'Wholesale: $29.99/month';
    RAISE NOTICE 'Retail: $49.99/month (67%% markup)';
    RAISE NOTICE '';
    RAISE NOTICE '📋 Next steps:';
    RAISE NOTICE '1. Refresh your browser';
    RAISE NOTICE '2. Go to Sites → [Your Site] → Modules tab';
    RAISE NOTICE '3. You should see "Booking & Scheduling" module';
    RAISE NOTICE '4. Toggle it ON to enable';
    RAISE NOTICE '5. Click "Open" to access booking dashboard';
  END IF;
END $$;
