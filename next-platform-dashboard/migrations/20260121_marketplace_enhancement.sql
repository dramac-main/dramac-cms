-- migrations/20260121_marketplace_enhancement.sql
-- Phase EM-02: Marketplace Enhancement
-- Full-text search, collections, enhanced reviews, and stats

-- ============================================================================
-- FULL-TEXT SEARCH SUPPORT
-- ============================================================================

-- Add search vector to modules_v2
ALTER TABLE modules_v2 
ADD COLUMN IF NOT EXISTS search_vector tsvector;

-- Create search index
CREATE INDEX IF NOT EXISTS idx_modules_v2_search 
ON modules_v2 USING gin(search_vector);

-- Update search vector trigger
CREATE OR REPLACE FUNCTION update_module_search_vector()
RETURNS trigger AS $$
BEGIN
  NEW.search_vector := 
    setweight(to_tsvector('english', COALESCE(NEW.name, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(NEW.long_description, '')), 'C') ||
    setweight(to_tsvector('english', COALESCE(array_to_string(NEW.tags, ' '), '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(NEW.category, '')), 'B');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_module_search ON modules_v2;
CREATE TRIGGER trigger_update_module_search
  BEFORE INSERT OR UPDATE ON modules_v2
  FOR EACH ROW
  EXECUTE FUNCTION update_module_search_vector();

-- Populate existing records (trigger will fire on update)
UPDATE modules_v2 SET updated_at = NOW() WHERE search_vector IS NULL;

-- ============================================================================
-- FEATURED COLLECTIONS
-- ============================================================================

CREATE TABLE IF NOT EXISTS module_collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  banner_image TEXT,
  
  -- Display
  display_order INTEGER DEFAULT 0,
  is_visible BOOLEAN DEFAULT true,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS module_collection_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_id UUID NOT NULL REFERENCES module_collections(id) ON DELETE CASCADE,
  module_id UUID NOT NULL REFERENCES modules_v2(id) ON DELETE CASCADE,
  display_order INTEGER DEFAULT 0,
  
  UNIQUE(collection_id, module_id)
);

-- Create indexes for collection queries
CREATE INDEX IF NOT EXISTS idx_module_collection_items_collection 
ON module_collection_items(collection_id);

CREATE INDEX IF NOT EXISTS idx_module_collection_items_module 
ON module_collection_items(module_id);

-- Insert default collections
INSERT INTO module_collections (slug, name, description, icon, display_order) VALUES
  ('featured', 'Featured', 'Hand-picked top modules', '⭐', 1),
  ('new-releases', 'New Releases', 'Recently added modules', '🆕', 2),
  ('top-rated', 'Top Rated', 'Highest rated by users', '🏆', 3),
  ('most-popular', 'Most Popular', 'Most installed modules', '🔥', 4),
  ('free-essentials', 'Free Essentials', 'Must-have free modules', '🎁', 5),
  ('enterprise-suite', 'Enterprise Suite', 'Complete business solutions', '🏢', 6)
ON CONFLICT (slug) DO NOTHING;

-- ============================================================================
-- ENHANCED REVIEWS
-- ============================================================================

-- Enhance existing module_reviews table if it exists
DO $$ 
BEGIN
  -- Add title column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'module_reviews' AND column_name = 'title') THEN
    ALTER TABLE module_reviews ADD COLUMN title TEXT;
  END IF;
  
  -- Add helpful_count column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'module_reviews' AND column_name = 'helpful_count') THEN
    ALTER TABLE module_reviews ADD COLUMN helpful_count INTEGER DEFAULT 0;
  END IF;
  
  -- Add verified_purchase column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'module_reviews' AND column_name = 'verified_purchase') THEN
    ALTER TABLE module_reviews ADD COLUMN verified_purchase BOOLEAN DEFAULT false;
  END IF;
  
  -- Add agency_name column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'module_reviews' AND column_name = 'agency_name') THEN
    ALTER TABLE module_reviews ADD COLUMN agency_name TEXT;
  END IF;
  
  -- Add response column (for module author responses)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'module_reviews' AND column_name = 'response') THEN
    ALTER TABLE module_reviews ADD COLUMN response TEXT;
  END IF;
  
  -- Add response_at column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'module_reviews' AND column_name = 'response_at') THEN
    ALTER TABLE module_reviews ADD COLUMN response_at TIMESTAMPTZ;
  END IF;
END $$;

-- Review helpful votes tracking
CREATE TABLE IF NOT EXISTS module_review_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID NOT NULL REFERENCES module_reviews(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  is_helpful BOOLEAN NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(review_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_module_review_votes_review 
ON module_review_votes(review_id);

CREATE INDEX IF NOT EXISTS idx_module_review_votes_user 
ON module_review_votes(user_id);

-- ============================================================================
-- MODULE STATS (For popularity sorting and analytics)
-- ============================================================================

CREATE TABLE IF NOT EXISTS module_stats_daily (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID NOT NULL REFERENCES modules_v2(id) ON DELETE CASCADE,
  stat_date DATE NOT NULL,
  
  views INTEGER DEFAULT 0,
  installs INTEGER DEFAULT 0,
  uninstalls INTEGER DEFAULT 0,
  
  UNIQUE(module_id, stat_date)
);

CREATE INDEX IF NOT EXISTS idx_module_stats_date ON module_stats_daily(stat_date DESC);
CREATE INDEX IF NOT EXISTS idx_module_stats_module ON module_stats_daily(module_id);

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to increment module stats
CREATE OR REPLACE FUNCTION increment_module_stat(
  p_module_id UUID,
  p_date DATE,
  p_field TEXT
) RETURNS void AS $$
BEGIN
  INSERT INTO module_stats_daily (module_id, stat_date, views, installs, uninstalls)
  VALUES (p_module_id, p_date, 
    CASE WHEN p_field = 'views' THEN 1 ELSE 0 END,
    CASE WHEN p_field = 'installs' THEN 1 ELSE 0 END,
    CASE WHEN p_field = 'uninstalls' THEN 1 ELSE 0 END
  )
  ON CONFLICT (module_id, stat_date)
  DO UPDATE SET
    views = module_stats_daily.views + CASE WHEN p_field = 'views' THEN 1 ELSE 0 END,
    installs = module_stats_daily.installs + CASE WHEN p_field = 'installs' THEN 1 ELSE 0 END,
    uninstalls = module_stats_daily.uninstalls + CASE WHEN p_field = 'uninstalls' THEN 1 ELSE 0 END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update helpful count when votes change
CREATE OR REPLACE FUNCTION update_review_helpful_count()
RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    UPDATE module_reviews 
    SET helpful_count = (
      SELECT COUNT(*) FROM module_review_votes 
      WHERE review_id = NEW.review_id AND is_helpful = true
    )
    WHERE id = NEW.review_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE module_reviews 
    SET helpful_count = (
      SELECT COUNT(*) FROM module_review_votes 
      WHERE review_id = OLD.review_id AND is_helpful = true
    )
    WHERE id = OLD.review_id;
    RETURN OLD;
  END IF;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_helpful_count ON module_review_votes;
CREATE TRIGGER trigger_update_helpful_count
  AFTER INSERT OR UPDATE OR DELETE ON module_review_votes
  FOR EACH ROW
  EXECUTE FUNCTION update_review_helpful_count();

-- ============================================================================
-- INDEXES FOR COMMON QUERIES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_modules_v2_category ON modules_v2(category);
CREATE INDEX IF NOT EXISTS idx_modules_v2_status ON modules_v2(status);
CREATE INDEX IF NOT EXISTS idx_modules_v2_featured ON modules_v2(is_featured) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS idx_modules_v2_rating ON modules_v2(rating_average DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_modules_v2_installs ON modules_v2(install_count DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_modules_v2_published ON modules_v2(published_at DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_modules_v2_pricing_type ON modules_v2(pricing_type);

-- Composite index for common marketplace queries
CREATE INDEX IF NOT EXISTS idx_modules_v2_marketplace 
ON modules_v2(status, category, pricing_type, install_count DESC NULLS LAST);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

-- Enable RLS on new tables
ALTER TABLE module_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE module_collection_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE module_review_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE module_stats_daily ENABLE ROW LEVEL SECURITY;

-- Collections are viewable by everyone (if visible)
DROP POLICY IF EXISTS "Collections are viewable by everyone" ON module_collections;
CREATE POLICY "Collections are viewable by everyone"
  ON module_collections FOR SELECT
  USING (is_visible = true);

-- Super admins can manage collections
DROP POLICY IF EXISTS "Super admins can manage collections" ON module_collections;
CREATE POLICY "Super admins can manage collections"
  ON module_collections FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'super_admin'
    )
  );

-- Collection items are viewable by everyone
DROP POLICY IF EXISTS "Collection items are viewable by everyone" ON module_collection_items;
CREATE POLICY "Collection items are viewable by everyone"
  ON module_collection_items FOR SELECT
  USING (true);

-- Super admins can manage collection items
DROP POLICY IF EXISTS "Super admins can manage collection items" ON module_collection_items;
CREATE POLICY "Super admins can manage collection items"
  ON module_collection_items FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'super_admin'
    )
  );

-- Users can vote on reviews
DROP POLICY IF EXISTS "Users can manage their own votes" ON module_review_votes;
CREATE POLICY "Users can manage their own votes"
  ON module_review_votes FOR ALL
  USING (auth.uid() = user_id);

-- Everyone can read review votes
DROP POLICY IF EXISTS "Everyone can read review votes" ON module_review_votes;
CREATE POLICY "Everyone can read review votes"
  ON module_review_votes FOR SELECT
  USING (true);

-- Stats are readable by authenticated users
DROP POLICY IF EXISTS "Stats are readable by authenticated users" ON module_stats_daily;
CREATE POLICY "Stats are readable by authenticated users"
  ON module_stats_daily FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Stats can be inserted by the system (via security definer function)
DROP POLICY IF EXISTS "Stats can be inserted by system" ON module_stats_daily;
CREATE POLICY "Stats can be inserted by system"
  ON module_stats_daily FOR INSERT
  WITH CHECK (true);

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

GRANT EXECUTE ON FUNCTION increment_module_stat(UUID, DATE, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION increment_module_stat(UUID, DATE, TEXT) TO anon;
