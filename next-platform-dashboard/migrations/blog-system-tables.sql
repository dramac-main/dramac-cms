-- Phase 83: Blog System Database Schema
-- Run this migration to create all blog-related tables

-- Blog categories
CREATE TABLE IF NOT EXISTS blog_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#6366f1', -- For UI badges
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(site_id, slug)
);

-- Blog posts
CREATE TABLE IF NOT EXISTS blog_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  author_id UUID REFERENCES profiles(id),
  
  -- Core content
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  excerpt TEXT, -- Short summary
  content JSONB NOT NULL DEFAULT '{}', -- Rich text as JSON (Tiptap/ProseMirror)
  content_html TEXT, -- Pre-rendered HTML for performance
  
  -- Media
  featured_image_url TEXT,
  featured_image_alt TEXT,
  
  -- SEO
  meta_title TEXT,
  meta_description TEXT,
  meta_keywords TEXT[],
  og_image_url TEXT,
  canonical_url TEXT,
  
  -- Publishing
  status TEXT DEFAULT 'draft', -- draft, scheduled, published, archived
  published_at TIMESTAMPTZ,
  scheduled_for TIMESTAMPTZ,
  
  -- Settings
  allow_comments BOOLEAN DEFAULT TRUE,
  is_featured BOOLEAN DEFAULT FALSE,
  reading_time_minutes INTEGER,
  tags TEXT[] DEFAULT '{}',
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(site_id, slug)
);

-- Many-to-many: posts to categories
CREATE TABLE IF NOT EXISTS blog_post_categories (
  post_id UUID NOT NULL REFERENCES blog_posts(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES blog_categories(id) ON DELETE CASCADE,
  
  PRIMARY KEY (post_id, category_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_blog_posts_site ON blog_posts(site_id);
CREATE INDEX IF NOT EXISTS idx_blog_posts_status ON blog_posts(status);
CREATE INDEX IF NOT EXISTS idx_blog_posts_published ON blog_posts(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON blog_posts(site_id, slug);
CREATE INDEX IF NOT EXISTS idx_blog_posts_featured ON blog_posts(site_id, is_featured);
CREATE INDEX IF NOT EXISTS idx_blog_posts_author ON blog_posts(author_id);
CREATE INDEX IF NOT EXISTS idx_blog_categories_site ON blog_categories(site_id);
CREATE INDEX IF NOT EXISTS idx_blog_post_categories_post ON blog_post_categories(post_id);
CREATE INDEX IF NOT EXISTS idx_blog_post_categories_cat ON blog_post_categories(category_id);

-- Function to calculate reading time
CREATE OR REPLACE FUNCTION calculate_reading_time(content_text TEXT)
RETURNS INTEGER AS $$
BEGIN
  -- Average reading speed: 200 words per minute
  RETURN GREATEST(1, CEIL(array_length(regexp_split_to_array(COALESCE(content_text, ''), '\s+'), 1) / 200.0));
END;
$$ LANGUAGE plpgsql;

-- Enable RLS
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_post_categories ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for re-runs)
DROP POLICY IF EXISTS "Super admins have full access to blog posts" ON blog_posts;
DROP POLICY IF EXISTS "Agency members can view agency posts" ON blog_posts;
DROP POLICY IF EXISTS "Agency members can create posts" ON blog_posts;
DROP POLICY IF EXISTS "Authors can edit own posts" ON blog_posts;
DROP POLICY IF EXISTS "Agency owners/admins can edit any post" ON blog_posts;
DROP POLICY IF EXISTS "Agency owners/admins can delete posts" ON blog_posts;
DROP POLICY IF EXISTS "Super admins have full access to categories" ON blog_categories;
DROP POLICY IF EXISTS "Agency members can view categories" ON blog_categories;
DROP POLICY IF EXISTS "Agency owners/admins can manage categories" ON blog_categories;
DROP POLICY IF EXISTS "Post category access follows post access" ON blog_post_categories;

-- RLS Policies for blog_posts
-- Super admins have full access
CREATE POLICY "Super admins have full access to blog posts"
ON blog_posts FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'super_admin'
  )
);

-- Agency members can view posts in their agency
CREATE POLICY "Agency members can view agency posts"
ON blog_posts FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM sites
    JOIN clients ON sites.client_id = clients.id
    JOIN agency_members ON clients.agency_id = agency_members.agency_id
    WHERE sites.id = blog_posts.site_id
    AND agency_members.user_id = auth.uid()
  )
);

-- Agency members can create posts (as drafts)
CREATE POLICY "Agency members can create posts"
ON blog_posts FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM sites
    JOIN clients ON sites.client_id = clients.id
    JOIN agency_members ON clients.agency_id = agency_members.agency_id
    WHERE sites.id = blog_posts.site_id
    AND agency_members.user_id = auth.uid()
  )
);

-- Authors can edit their own posts
CREATE POLICY "Authors can edit own posts"
ON blog_posts FOR UPDATE
TO authenticated
USING (
  author_id = auth.uid()
);

-- Agency owners/admins can edit any post in their agency
CREATE POLICY "Agency owners/admins can edit any post"
ON blog_posts FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM sites
    JOIN clients ON sites.client_id = clients.id
    JOIN agency_members ON clients.agency_id = agency_members.agency_id
    WHERE sites.id = blog_posts.site_id
    AND agency_members.user_id = auth.uid()
    AND agency_members.role IN ('owner', 'admin')
  )
);

-- Only owners/admins can delete posts
CREATE POLICY "Agency owners/admins can delete posts"
ON blog_posts FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM sites
    JOIN clients ON sites.client_id = clients.id
    JOIN agency_members ON clients.agency_id = agency_members.agency_id
    WHERE sites.id = blog_posts.site_id
    AND agency_members.user_id = auth.uid()
    AND agency_members.role IN ('owner', 'admin')
  )
);

-- RLS Policies for blog_categories
CREATE POLICY "Super admins have full access to categories"
ON blog_categories FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'super_admin'
  )
);

CREATE POLICY "Agency members can view categories"
ON blog_categories FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM sites
    JOIN clients ON sites.client_id = clients.id
    JOIN agency_members ON clients.agency_id = agency_members.agency_id
    WHERE sites.id = blog_categories.site_id
    AND agency_members.user_id = auth.uid()
  )
);

CREATE POLICY "Agency owners/admins can manage categories"
ON blog_categories FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM sites
    JOIN clients ON sites.client_id = clients.id
    JOIN agency_members ON clients.agency_id = agency_members.agency_id
    WHERE sites.id = blog_categories.site_id
    AND agency_members.user_id = auth.uid()
    AND agency_members.role IN ('owner', 'admin')
  )
);

-- RLS for blog_post_categories (junction table)
CREATE POLICY "Post category access follows post access"
ON blog_post_categories FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM blog_posts
    WHERE blog_posts.id = blog_post_categories.post_id
  )
);

-- Grant access to anon for public blog reading
CREATE POLICY "Public can read published posts"
ON blog_posts FOR SELECT
TO anon
USING (status = 'published');

CREATE POLICY "Public can read categories"
ON blog_categories FOR SELECT
TO anon
USING (true);

CREATE POLICY "Public can read post categories"
ON blog_post_categories FOR SELECT
TO anon
USING (true);
