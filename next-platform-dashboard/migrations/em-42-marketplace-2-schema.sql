-- migrations/em-42-marketplace-2-schema.sql
-- Phase EM-42: Module Marketplace 2.0
-- Developer profiles, enhanced reviews, collections, featured modules, search & recommendations

-- ============================================================================
-- DEVELOPER PROFILES
-- ============================================================================

CREATE TABLE IF NOT EXISTS developer_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  agency_id UUID REFERENCES agencies(id) ON DELETE SET NULL,
  
  -- Profile info
  display_name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  bio TEXT,
  avatar_url TEXT,
  cover_image_url TEXT,
  
  -- Links
  website_url TEXT,
  github_url TEXT,
  twitter_url TEXT,
  linkedin_url TEXT,
  
  -- Verification
  is_verified BOOLEAN DEFAULT false,
  verified_at TIMESTAMPTZ,
  verification_type TEXT CHECK (verification_type IN (
    'identity', 'business', 'partner'
  )),
  
  -- Stats (denormalized for performance)
  total_modules INTEGER DEFAULT 0,
  total_downloads INTEGER DEFAULT 0,
  total_revenue DECIMAL(12,2) DEFAULT 0,
  avg_rating DECIMAL(3,2) DEFAULT 0,
  total_reviews INTEGER DEFAULT 0,
  
  -- Settings
  accepts_custom_requests BOOLEAN DEFAULT false,
  custom_request_rate DECIMAL(10,2),       -- Hourly rate
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id)
);

-- ============================================================================
-- ENHANCED MODULE REVIEWS (extends existing table or creates new)
-- ============================================================================

-- Create module_reviews table if it doesn't exist
CREATE TABLE IF NOT EXISTS module_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID NOT NULL REFERENCES modules_v2(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  agency_id UUID REFERENCES agencies(id),
  
  -- Review content
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title TEXT,
  content TEXT,
  
  -- Pros/Cons
  pros TEXT[] DEFAULT '{}',
  cons TEXT[] DEFAULT '{}',
  
  -- Response
  developer_response TEXT,
  developer_responded_at TIMESTAMPTZ,
  
  -- Verification
  is_verified_purchase BOOLEAN DEFAULT false,
  
  -- Moderation
  status TEXT DEFAULT 'published' CHECK (status IN (
    'pending', 'published', 'hidden', 'flagged', 'removed'
  )),
  
  -- Engagement
  helpful_count INTEGER DEFAULT 0,
  report_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
  
  -- Note: UNIQUE constraint removed - table already exists from previous migration
  -- UNIQUE(module_id, user_id)
);

-- Add unique constraint if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'module_reviews_module_user_unique'
  ) THEN
    ALTER TABLE module_reviews 
    ADD CONSTRAINT module_reviews_module_user_unique 
    UNIQUE (module_id, user_id);
  END IF;
EXCEPTION
  WHEN others THEN
    -- Constraint might fail if data exists, that's okay
    NULL;
END $$;

-- Add new columns to module_reviews if they don't exist
DO $$ 
BEGIN
  -- Add user_id column (existing table uses agency_id, we need user_id for auth)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'module_reviews' AND column_name = 'user_id') THEN
    ALTER TABLE module_reviews ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
  
  -- Add pros column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'module_reviews' AND column_name = 'pros') THEN
    ALTER TABLE module_reviews ADD COLUMN pros TEXT[] DEFAULT '{}';
  END IF;
  
  -- Add cons column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'module_reviews' AND column_name = 'cons') THEN
    ALTER TABLE module_reviews ADD COLUMN cons TEXT[] DEFAULT '{}';
  END IF;
  
  -- Add developer_response column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'module_reviews' AND column_name = 'developer_response') THEN
    ALTER TABLE module_reviews ADD COLUMN developer_response TEXT;
  END IF;
  
  -- Add developer_responded_at column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'module_reviews' AND column_name = 'developer_responded_at') THEN
    ALTER TABLE module_reviews ADD COLUMN developer_responded_at TIMESTAMPTZ;
  END IF;
  
  -- Add status column (may already exist but with different constraint)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'module_reviews' AND column_name = 'status') THEN
    ALTER TABLE module_reviews ADD COLUMN status TEXT DEFAULT 'published';
  END IF;
  
  -- Add report_count column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'module_reviews' AND column_name = 'report_count') THEN
    ALTER TABLE module_reviews ADD COLUMN report_count INTEGER DEFAULT 0;
  END IF;
END $$;

-- ============================================================================
-- REVIEW HELPFUL VOTES
-- ============================================================================

CREATE TABLE IF NOT EXISTS review_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID NOT NULL REFERENCES module_reviews(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  vote_type TEXT NOT NULL CHECK (vote_type IN ('helpful', 'not_helpful')),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(review_id, user_id)
);

-- ============================================================================
-- FEATURED MODULES (Enhanced)
-- ============================================================================

CREATE TABLE IF NOT EXISTS featured_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID NOT NULL REFERENCES modules_v2(id) ON DELETE CASCADE,
  
  -- Placement
  placement TEXT NOT NULL CHECK (placement IN (
    'hero', 'trending', 'new', 'top_rated', 'staff_picks', 'category'
  )),
  category TEXT,  -- Used when placement = 'category'
  
  -- Display
  headline TEXT,
  description TEXT,
  custom_image_url TEXT,
  
  -- Scheduling
  starts_at TIMESTAMPTZ DEFAULT NOW(),
  ends_at TIMESTAMPTZ,
  
  -- Ordering
  position INTEGER DEFAULT 0,
  
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- SEARCH HISTORY (for recommendations)
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_search_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  query TEXT NOT NULL,
  filters JSONB,
  result_count INTEGER,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- MODULE VIEWS (for recommendations and trending)
-- ============================================================================

CREATE TABLE IF NOT EXISTS module_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID NOT NULL REFERENCES modules_v2(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id TEXT,
  
  -- Engagement
  view_duration_seconds INTEGER,
  scrolled_to_bottom BOOLEAN DEFAULT false,
  clicked_install BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- MODERATION REPORTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS moderation_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('review', 'module', 'developer')),
  target_id UUID NOT NULL,
  reported_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  details TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN (
    'pending', 'reviewing', 'resolved', 'dismissed'
  )),
  resolved_by UUID REFERENCES auth.users(id),
  resolved_at TIMESTAMPTZ,
  resolution_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Developer profiles
CREATE INDEX IF NOT EXISTS idx_developer_profiles_user ON developer_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_developer_profiles_slug ON developer_profiles(slug);
CREATE INDEX IF NOT EXISTS idx_developer_profiles_verified ON developer_profiles(is_verified) WHERE is_verified = true;
CREATE INDEX IF NOT EXISTS idx_developer_profiles_agency ON developer_profiles(agency_id);

-- Reviews
CREATE INDEX IF NOT EXISTS idx_reviews_module ON module_reviews(module_id, status);
CREATE INDEX IF NOT EXISTS idx_reviews_user ON module_reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON module_reviews(module_id, rating);
CREATE INDEX IF NOT EXISTS idx_reviews_created ON module_reviews(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reviews_helpful ON module_reviews(helpful_count DESC);

-- Review votes
CREATE INDEX IF NOT EXISTS idx_review_votes_review ON review_votes(review_id);
CREATE INDEX IF NOT EXISTS idx_review_votes_user ON review_votes(user_id);

-- Featured modules
CREATE INDEX IF NOT EXISTS idx_featured_modules_placement ON featured_modules(placement, is_active);
CREATE INDEX IF NOT EXISTS idx_featured_modules_active ON featured_modules(is_active, starts_at, ends_at);

-- Module views
CREATE INDEX IF NOT EXISTS idx_module_views_module ON module_views(module_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_module_views_user ON module_views(user_id);
CREATE INDEX IF NOT EXISTS idx_module_views_date ON module_views(created_at DESC);

-- Search history
CREATE INDEX IF NOT EXISTS idx_search_history_user ON user_search_history(user_id, created_at DESC);

-- Moderation reports
CREATE INDEX IF NOT EXISTS idx_moderation_reports_status ON moderation_reports(status);
CREATE INDEX IF NOT EXISTS idx_moderation_reports_type ON moderation_reports(type, target_id);

-- ============================================================================
-- ADD DEVELOPER PROFILE REFERENCE TO MODULES
-- ============================================================================

DO $$ 
BEGIN
  -- Add developer_profile_id to modules_v2 if not exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'modules_v2' AND column_name = 'developer_profile_id') THEN
    ALTER TABLE modules_v2 ADD COLUMN developer_profile_id UUID REFERENCES developer_profiles(id);
    CREATE INDEX IF NOT EXISTS idx_modules_v2_developer ON modules_v2(developer_profile_id);
  END IF;

  -- Add review_count to modules_v2 if not exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'modules_v2' AND column_name = 'review_count') THEN
    ALTER TABLE modules_v2 ADD COLUMN review_count INTEGER DEFAULT 0;
  END IF;
END $$;

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to update developer stats
CREATE OR REPLACE FUNCTION update_developer_stats_from_modules()
RETURNS TRIGGER AS $$
DECLARE
  dev_user_id UUID;
BEGIN
  -- Get the user_id from the module (creator)
  IF TG_OP = 'DELETE' THEN
    SELECT created_by INTO dev_user_id FROM modules_v2 WHERE id = OLD.module_id LIMIT 1;
  ELSE
    SELECT created_by INTO dev_user_id FROM modules_v2 WHERE id = NEW.module_id LIMIT 1;
  END IF;
  
  IF dev_user_id IS NOT NULL THEN
    UPDATE developer_profiles dp
    SET 
      total_modules = (
        SELECT COUNT(*) FROM modules_v2 
        WHERE created_by = dp.user_id AND status = 'active'
      ),
      total_downloads = (
        SELECT COALESCE(SUM(install_count), 0) FROM modules_v2 
        WHERE created_by = dp.user_id
      ),
      avg_rating = (
        SELECT COALESCE(AVG(mr.rating)::DECIMAL(3,2), 0) 
        FROM module_reviews mr 
        JOIN modules_v2 m ON mr.module_id = m.id 
        WHERE m.created_by = dp.user_id AND mr.status = 'published'
      ),
      total_reviews = (
        SELECT COUNT(*) 
        FROM module_reviews mr 
        JOIN modules_v2 m ON mr.module_id = m.id 
        WHERE m.created_by = dp.user_id AND mr.status = 'published'
      ),
      updated_at = NOW()
    WHERE dp.user_id = dev_user_id;
  END IF;
  
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to update module rating from reviews
CREATE OR REPLACE FUNCTION update_module_rating_from_reviews()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    UPDATE modules_v2
    SET 
      rating_average = (
        SELECT COALESCE(AVG(rating)::DECIMAL(3,2), 0) 
        FROM module_reviews 
        WHERE module_id = OLD.module_id AND status = 'published'
      ),
      review_count = (
        SELECT COUNT(*) 
        FROM module_reviews 
        WHERE module_id = OLD.module_id AND status = 'published'
      )
    WHERE id = OLD.module_id;
    
    -- Also update developer stats
    PERFORM update_developer_stats_from_modules();
    
    RETURN OLD;
  ELSE
    UPDATE modules_v2
    SET 
      rating_average = (
        SELECT COALESCE(AVG(rating)::DECIMAL(3,2), 0) 
        FROM module_reviews 
        WHERE module_id = NEW.module_id AND status = 'published'
      ),
      review_count = (
        SELECT COUNT(*) 
        FROM module_reviews 
        WHERE module_id = NEW.module_id AND status = 'published'
      )
    WHERE id = NEW.module_id;
    
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to update review helpful count
CREATE OR REPLACE FUNCTION update_review_helpful_count_v2()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    UPDATE module_reviews 
    SET helpful_count = (
      SELECT COUNT(*) FROM review_votes 
      WHERE review_id = NEW.review_id AND vote_type = 'helpful'
    )
    WHERE id = NEW.review_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE module_reviews 
    SET helpful_count = (
      SELECT COUNT(*) FROM review_votes 
      WHERE review_id = OLD.review_id AND vote_type = 'helpful'
    )
    WHERE id = OLD.review_id;
    RETURN OLD;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to get trending modules
CREATE OR REPLACE FUNCTION get_trending_modules(
  since_date TIMESTAMPTZ,
  limit_count INTEGER DEFAULT 10
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  slug TEXT,
  description TEXT,
  icon TEXT,
  category TEXT,
  type TEXT,
  rating DECIMAL,
  review_count INTEGER,
  install_count INTEGER,
  price DECIMAL,
  tags TEXT[],
  view_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    m.id,
    m.name,
    m.slug,
    m.description,
    m.icon,
    m.category,
    m.install_level as type,
    m.rating_average::DECIMAL as rating,
    m.review_count,
    m.install_count,
    m.wholesale_price_monthly as price,
    m.tags,
    COUNT(mv.id) as view_count
  FROM modules_v2 m
  LEFT JOIN module_views mv ON m.id = mv.module_id 
    AND mv.created_at >= since_date
  WHERE m.status = 'active'
  GROUP BY m.id
  ORDER BY view_count DESC, m.install_count DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Update module rating when reviews change
DROP TRIGGER IF EXISTS trg_update_module_rating ON module_reviews;
CREATE TRIGGER trg_update_module_rating
AFTER INSERT OR UPDATE OR DELETE ON module_reviews
FOR EACH ROW EXECUTE FUNCTION update_module_rating_from_reviews();

-- Update helpful count when votes change
DROP TRIGGER IF EXISTS trg_update_helpful_count_v2 ON review_votes;
CREATE TRIGGER trg_update_helpful_count_v2
AFTER INSERT OR UPDATE OR DELETE ON review_votes
FOR EACH ROW EXECUTE FUNCTION update_review_helpful_count_v2();

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

-- Enable RLS on new tables
ALTER TABLE developer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE module_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE featured_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_search_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE module_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE moderation_reports ENABLE ROW LEVEL SECURITY;

-- Developer Profiles Policies
DROP POLICY IF EXISTS "Developer profiles are viewable by everyone" ON developer_profiles;
CREATE POLICY "Developer profiles are viewable by everyone" ON developer_profiles
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert their own profile" ON developer_profiles;
CREATE POLICY "Users can insert their own profile" ON developer_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own profile" ON developer_profiles;
CREATE POLICY "Users can update their own profile" ON developer_profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- Reviews Policies
DROP POLICY IF EXISTS "Published reviews are viewable by everyone" ON module_reviews;
CREATE POLICY "Published reviews are viewable by everyone" ON module_reviews
  FOR SELECT USING (status = 'published' OR user_id = auth.uid());

DROP POLICY IF EXISTS "Authenticated users can create reviews" ON module_reviews;
CREATE POLICY "Authenticated users can create reviews" ON module_reviews
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own reviews" ON module_reviews;
CREATE POLICY "Users can update their own reviews" ON module_reviews
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own reviews" ON module_reviews;
CREATE POLICY "Users can delete their own reviews" ON module_reviews
  FOR DELETE USING (auth.uid() = user_id);

-- Review Votes Policies
DROP POLICY IF EXISTS "Votes are viewable by everyone" ON review_votes;
CREATE POLICY "Votes are viewable by everyone" ON review_votes
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can vote" ON review_votes;
CREATE POLICY "Authenticated users can vote" ON review_votes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own votes" ON review_votes;
CREATE POLICY "Users can update their own votes" ON review_votes
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own votes" ON review_votes;
CREATE POLICY "Users can delete their own votes" ON review_votes
  FOR DELETE USING (auth.uid() = user_id);

-- Featured Modules Policies
DROP POLICY IF EXISTS "Featured modules are viewable by everyone" ON featured_modules;
CREATE POLICY "Featured modules are viewable by everyone" ON featured_modules
  FOR SELECT USING (is_active = true);

-- Search History Policies
DROP POLICY IF EXISTS "Users can view their own search history" ON user_search_history;
CREATE POLICY "Users can view their own search history" ON user_search_history
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own search history" ON user_search_history;
CREATE POLICY "Users can insert their own search history" ON user_search_history
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Module Views Policies (allow anonymous viewing for analytics)
DROP POLICY IF EXISTS "Module views can be inserted by anyone" ON module_views;
CREATE POLICY "Module views can be inserted by anyone" ON module_views
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Module views are viewable by module developers" ON module_views;
CREATE POLICY "Module views are viewable by module developers" ON module_views
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM modules_v2 m
      JOIN developer_profiles dp ON m.developer_profile_id = dp.id
      WHERE m.id = module_views.module_id AND dp.user_id = auth.uid()
    )
  );

-- Moderation Reports Policies
DROP POLICY IF EXISTS "Users can create reports" ON moderation_reports;
CREATE POLICY "Users can create reports" ON moderation_reports
  FOR INSERT WITH CHECK (auth.uid() = reported_by);

DROP POLICY IF EXISTS "Users can view their own reports" ON moderation_reports;
CREATE POLICY "Users can view their own reports" ON moderation_reports
  FOR SELECT USING (auth.uid() = reported_by);

-- ============================================================================
-- INSERT SAMPLE FEATURED PLACEMENTS
-- ============================================================================

-- Insert sample featured placements for testing (safe to run multiple times)
INSERT INTO featured_modules (module_id, placement, headline, description, position, is_active)
SELECT 
  id,
  'staff_picks',
  'Staff Pick: ' || name,
  'Highly recommended by our team',
  ROW_NUMBER() OVER (ORDER BY install_count DESC),
  true
FROM modules_v2 
WHERE is_featured = true AND status = 'active'
LIMIT 5
ON CONFLICT DO NOTHING;

COMMIT;
