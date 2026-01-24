-- Seed Module Collections with Existing Modules
-- Links modules to featured collections for marketplace display

-- ============================================================================
-- LINK BOOKING MODULE TO COLLECTIONS
-- ============================================================================

-- Add Booking to Featured
INSERT INTO module_collection_items (collection_id, module_id, display_order)
SELECT 
  c.id as collection_id,
  m.id as module_id,
  1 as display_order
FROM module_collections c
CROSS JOIN modules_v2 m
WHERE c.slug = 'featured' 
  AND m.slug = 'booking'
  AND NOT EXISTS (
    SELECT 1 FROM module_collection_items 
    WHERE collection_id = c.id AND module_id = m.id
  );

-- Add Booking to Top Rated
INSERT INTO module_collection_items (collection_id, module_id, display_order)
SELECT 
  c.id as collection_id,
  m.id as module_id,
  1 as display_order
FROM module_collections c
CROSS JOIN modules_v2 m
WHERE c.slug = 'top-rated' 
  AND m.slug = 'booking'
  AND NOT EXISTS (
    SELECT 1 FROM module_collection_items 
    WHERE collection_id = c.id AND module_id = m.id
  );

-- Add Booking to Most Popular
INSERT INTO module_collection_items (collection_id, module_id, display_order)
SELECT 
  c.id as collection_id,
  m.id as module_id,
  1 as display_order
FROM module_collections c
CROSS JOIN modules_v2 m
WHERE c.slug = 'most-popular' 
  AND m.slug = 'booking'
  AND NOT EXISTS (
    SELECT 1 FROM module_collection_items 
    WHERE collection_id = c.id AND module_id = m.id
  );

-- Add Booking to Enterprise Suite
INSERT INTO module_collection_items (collection_id, module_id, display_order)
SELECT 
  c.id as collection_id,
  m.id as module_id,
  1 as display_order
FROM module_collections c
CROSS JOIN modules_v2 m
WHERE c.slug = 'enterprise-suite' 
  AND m.slug = 'booking'
  AND NOT EXISTS (
    SELECT 1 FROM module_collection_items 
    WHERE collection_id = c.id AND module_id = m.id
  );

-- ============================================================================
-- LINK E-COMMERCE MODULE TO COLLECTIONS
-- ============================================================================

-- Add E-Commerce to Featured
INSERT INTO module_collection_items (collection_id, module_id, display_order)
SELECT 
  c.id as collection_id,
  m.id as module_id,
  2 as display_order
FROM module_collections c
CROSS JOIN modules_v2 m
WHERE c.slug = 'featured' 
  AND m.slug = 'ecommerce'
  AND NOT EXISTS (
    SELECT 1 FROM module_collection_items 
    WHERE collection_id = c.id AND module_id = m.id
  );

-- Add E-Commerce to New Releases
INSERT INTO module_collection_items (collection_id, module_id, display_order)
SELECT 
  c.id as collection_id,
  m.id as module_id,
  1 as display_order
FROM module_collections c
CROSS JOIN modules_v2 m
WHERE c.slug = 'new-releases' 
  AND m.slug = 'ecommerce'
  AND NOT EXISTS (
    SELECT 1 FROM module_collection_items 
    WHERE collection_id = c.id AND module_id = m.id
  );

-- Add E-Commerce to Top Rated
INSERT INTO module_collection_items (collection_id, module_id, display_order)
SELECT 
  c.id as collection_id,
  m.id as module_id,
  2 as display_order
FROM module_collections c
CROSS JOIN modules_v2 m
WHERE c.slug = 'top-rated' 
  AND m.slug = 'ecommerce'
  AND NOT EXISTS (
    SELECT 1 FROM module_collection_items 
    WHERE collection_id = c.id AND module_id = m.id
  );

-- Add E-Commerce to Enterprise Suite
INSERT INTO module_collection_items (collection_id, module_id, display_order)
SELECT 
  c.id as collection_id,
  m.id as module_id,
  2 as display_order
FROM module_collections c
CROSS JOIN modules_v2 m
WHERE c.slug = 'enterprise-suite' 
  AND m.slug = 'ecommerce'
  AND NOT EXISTS (
    SELECT 1 FROM module_collection_items 
    WHERE collection_id = c.id AND module_id = m.id
  );

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Verify collections now have items
DO $$
DECLARE
  collection_count INTEGER;
  item_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO collection_count FROM module_collections WHERE is_visible = true;
  SELECT COUNT(*) INTO item_count FROM module_collection_items;
  
  RAISE NOTICE '✅ Seeded % collections with % module items', collection_count, item_count;
  
  -- Log collection details
  FOR collection_count IN 
    SELECT 
      c.name,
      COUNT(i.id) as modules
    FROM module_collections c
    LEFT JOIN module_collection_items i ON c.id = i.collection_id
    GROUP BY c.name
    ORDER BY c.display_order
  LOOP
    RAISE NOTICE '   - %', collection_count;
  END LOOP;
END $$;
