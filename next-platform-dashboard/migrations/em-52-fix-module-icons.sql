-- Update Module Icons to Emojis
-- Fixes booking and ecommerce module icons to display properly in marketplace

-- Update booking module icon from 'Calendar' to calendar emoji
UPDATE modules_v2
SET icon = '📅', updated_at = NOW()
WHERE slug = 'booking' AND icon = 'Calendar';

-- Verify e-commerce module has correct emoji (should already be fixed)
UPDATE modules_v2
SET icon = '🛒', updated_at = NOW()
WHERE slug = 'ecommerce' AND (icon = 'ShoppingCart' OR icon IS NULL OR icon = '');

-- Verify the updates
DO $$
DECLARE
  booking_icon TEXT;
  ecommerce_icon TEXT;
BEGIN
  SELECT icon INTO booking_icon FROM modules_v2 WHERE slug = 'booking';
  SELECT icon INTO ecommerce_icon FROM modules_v2 WHERE slug = 'ecommerce';
  
  RAISE NOTICE '✅ Booking module icon: %', COALESCE(booking_icon, 'NULL');
  RAISE NOTICE '✅ E-Commerce module icon: %', COALESCE(ecommerce_icon, 'NULL');
END $$;
