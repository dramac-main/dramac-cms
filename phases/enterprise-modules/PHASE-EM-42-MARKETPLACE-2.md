# Phase EM-42: Module Marketplace 2.0

> **Priority**: 🟡 MEDIUM
> **Estimated Time**: 15-18 hours
> **Prerequisites**: EM-01, EM-02, EM-03
> **Status**: 📋 READY TO IMPLEMENT

---

## 🎯 Objective

Upgrade the marketplace with **advanced discovery and social features**:
1. Reviews and ratings system
2. Developer profiles and portfolios
3. Advanced search and filtering
4. Featured modules and collections
5. Module recommendations engine

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                    MARKETPLACE 2.0                                   │
├────────────────┬─────────────────┬──────────────────────────────────┤
│   DISCOVERY    │   SOCIAL        │      COMMERCE                    │
├────────────────┼─────────────────┼──────────────────────────────────┤
│ Search Engine  │ Reviews         │ Pricing Tiers                    │
│ Categories     │ Ratings         │ Subscriptions                    │
│ Collections    │ Comments        │ Free Trials                      │
│ Recommendations│ Developer Profile│ Purchase Flow                   │
└────────────────┴─────────────────┴──────────────────────────────────┘
```

---

## 📋 Implementation Tasks

### Task 1: Database Schema (1 hour)

```sql
-- migrations/em-42-marketplace-2-schema.sql

-- Developer Profiles
CREATE TABLE developer_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  agency_id UUID REFERENCES agencies(id),
  
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
  
  -- Stats
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

-- Module Reviews
CREATE TABLE module_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  agency_id UUID REFERENCES agencies(id),
  
  -- Review content
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title TEXT,
  content TEXT,
  
  -- Pros/Cons
  pros TEXT[],
  cons TEXT[],
  
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
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(module_id, user_id)
);

-- Review Helpful Votes
CREATE TABLE review_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID NOT NULL REFERENCES module_reviews(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  vote_type TEXT NOT NULL CHECK (vote_type IN ('helpful', 'not_helpful')),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(review_id, user_id)
);

-- Module Collections (curated lists)
CREATE TABLE module_collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Owner
  created_by UUID REFERENCES users(id),
  is_official BOOLEAN DEFAULT false,
  
  -- Content
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  cover_image_url TEXT,
  
  -- Display
  is_featured BOOLEAN DEFAULT false,
  featured_order INTEGER,
  
  -- Stats
  module_count INTEGER DEFAULT 0,
  view_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Collection Items
CREATE TABLE collection_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_id UUID NOT NULL REFERENCES module_collections(id) ON DELETE CASCADE,
  module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  
  -- Ordering
  position INTEGER DEFAULT 0,
  
  -- Notes
  curator_note TEXT,
  
  added_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(collection_id, module_id)
);

-- Featured Modules
CREATE TABLE featured_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  
  -- Placement
  placement TEXT NOT NULL CHECK (placement IN (
    'hero', 'trending', 'new', 'top_rated', 'staff_picks', 'category'
  )),
  category_id UUID REFERENCES module_categories(id),
  
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

-- Search History (for recommendations)
CREATE TABLE user_search_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  query TEXT NOT NULL,
  filters JSONB,
  result_count INTEGER,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Module Views (for recommendations)
CREATE TABLE module_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  session_id TEXT,
  
  -- Engagement
  view_duration_seconds INTEGER,
  scrolled_to_bottom BOOLEAN DEFAULT false,
  clicked_install BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_developer_profiles_user ON developer_profiles(user_id);
CREATE INDEX idx_developer_profiles_slug ON developer_profiles(slug);
CREATE INDEX idx_reviews_module ON module_reviews(module_id, status);
CREATE INDEX idx_reviews_user ON module_reviews(user_id);
CREATE INDEX idx_reviews_rating ON module_reviews(module_id, rating);
CREATE INDEX idx_collections_featured ON module_collections(is_featured, featured_order);
CREATE INDEX idx_featured_modules_placement ON featured_modules(placement, is_active);
CREATE INDEX idx_module_views_module ON module_views(module_id, created_at DESC);

-- Full-text search on modules
CREATE INDEX idx_modules_fts ON modules USING gin(
  to_tsvector('english', name || ' ' || COALESCE(description, '') || ' ' || COALESCE(tags::text, ''))
);

-- Trigger to update developer stats
CREATE OR REPLACE FUNCTION update_developer_stats()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE developer_profiles dp
  SET 
    total_modules = (SELECT COUNT(*) FROM modules WHERE created_by = dp.user_id AND status = 'published'),
    total_downloads = (SELECT COALESCE(SUM(install_count), 0) FROM modules WHERE created_by = dp.user_id),
    avg_rating = (
      SELECT COALESCE(AVG(rating), 0) 
      FROM module_reviews mr 
      JOIN modules m ON mr.module_id = m.id 
      WHERE m.created_by = dp.user_id AND mr.status = 'published'
    ),
    total_reviews = (
      SELECT COUNT(*) 
      FROM module_reviews mr 
      JOIN modules m ON mr.module_id = m.id 
      WHERE m.created_by = dp.user_id AND mr.status = 'published'
    ),
    updated_at = NOW()
  WHERE dp.user_id = NEW.created_by OR (TG_OP = 'DELETE' AND dp.user_id = OLD.created_by);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_developer_stats_module
AFTER INSERT OR UPDATE OR DELETE ON modules
FOR EACH ROW EXECUTE FUNCTION update_developer_stats();
```

---

### Task 2: Review Service (2 hours)

```typescript
// src/lib/marketplace/review-service.ts

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface Review {
  id: string;
  module_id: string;
  user_id: string;
  rating: number;
  title: string | null;
  content: string | null;
  pros: string[];
  cons: string[];
  developer_response: string | null;
  developer_responded_at: string | null;
  is_verified_purchase: boolean;
  status: string;
  helpful_count: number;
  created_at: string;
  user?: {
    name: string;
    avatar_url: string;
  };
}

export interface ReviewStats {
  averageRating: number;
  totalReviews: number;
  distribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
}

export class ReviewService {
  /**
   * Create a review
   */
  async createReview(
    moduleId: string,
    userId: string,
    review: {
      rating: number;
      title?: string;
      content?: string;
      pros?: string[];
      cons?: string[];
    }
  ): Promise<Review> {
    // Check if user has purchased/installed the module
    const { data: installation } = await supabase
      .from('site_modules')
      .select('id')
      .eq('module_id', moduleId)
      .eq('installed_by', userId)
      .single();

    const isVerifiedPurchase = !!installation;

    // Check for existing review
    const { data: existing } = await supabase
      .from('module_reviews')
      .select('id')
      .eq('module_id', moduleId)
      .eq('user_id', userId)
      .single();

    if (existing) {
      throw new Error('You have already reviewed this module');
    }

    const { data, error } = await supabase
      .from('module_reviews')
      .insert({
        module_id: moduleId,
        user_id: userId,
        rating: review.rating,
        title: review.title,
        content: review.content,
        pros: review.pros || [],
        cons: review.cons || [],
        is_verified_purchase: isVerifiedPurchase,
        status: 'published'
      })
      .select(`
        *,
        user:users(name, avatar_url)
      `)
      .single();

    if (error) throw error;

    // Update module rating
    await this.updateModuleRating(moduleId);

    return data;
  }

  /**
   * Update a review
   */
  async updateReview(
    reviewId: string,
    userId: string,
    updates: {
      rating?: number;
      title?: string;
      content?: string;
      pros?: string[];
      cons?: string[];
    }
  ): Promise<Review> {
    const { data, error } = await supabase
      .from('module_reviews')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', reviewId)
      .eq('user_id', userId)
      .select(`
        *,
        user:users(name, avatar_url)
      `)
      .single();

    if (error) throw error;

    // Update module rating
    await this.updateModuleRating(data.module_id);

    return data;
  }

  /**
   * Delete a review
   */
  async deleteReview(reviewId: string, userId: string): Promise<void> {
    const { data: review } = await supabase
      .from('module_reviews')
      .select('module_id')
      .eq('id', reviewId)
      .eq('user_id', userId)
      .single();

    if (!review) throw new Error('Review not found');

    await supabase
      .from('module_reviews')
      .delete()
      .eq('id', reviewId)
      .eq('user_id', userId);

    // Update module rating
    await this.updateModuleRating(review.module_id);
  }

  /**
   * Get reviews for a module
   */
  async getModuleReviews(
    moduleId: string,
    options: {
      page?: number;
      limit?: number;
      sortBy?: 'newest' | 'oldest' | 'highest' | 'lowest' | 'helpful';
      filterRating?: number;
    } = {}
  ): Promise<{ reviews: Review[]; total: number }> {
    const page = options.page || 1;
    const limit = options.limit || 10;
    const from = (page - 1) * limit;

    let query = supabase
      .from('module_reviews')
      .select(`
        *,
        user:users(name, avatar_url)
      `, { count: 'exact' })
      .eq('module_id', moduleId)
      .eq('status', 'published');

    // Filter by rating
    if (options.filterRating) {
      query = query.eq('rating', options.filterRating);
    }

    // Sorting
    switch (options.sortBy) {
      case 'oldest':
        query = query.order('created_at', { ascending: true });
        break;
      case 'highest':
        query = query.order('rating', { ascending: false });
        break;
      case 'lowest':
        query = query.order('rating', { ascending: true });
        break;
      case 'helpful':
        query = query.order('helpful_count', { ascending: false });
        break;
      default:
        query = query.order('created_at', { ascending: false });
    }

    query = query.range(from, from + limit - 1);

    const { data, count, error } = await query;

    if (error) throw error;

    return {
      reviews: data || [],
      total: count || 0
    };
  }

  /**
   * Get review statistics for a module
   */
  async getReviewStats(moduleId: string): Promise<ReviewStats> {
    const { data, error } = await supabase
      .from('module_reviews')
      .select('rating')
      .eq('module_id', moduleId)
      .eq('status', 'published');

    if (error) throw error;

    const reviews = data || [];
    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

    reviews.forEach(r => {
      distribution[r.rating as 1|2|3|4|5]++;
    });

    const total = reviews.length;
    const sum = reviews.reduce((acc, r) => acc + r.rating, 0);

    return {
      averageRating: total > 0 ? sum / total : 0,
      totalReviews: total,
      distribution
    };
  }

  /**
   * Add developer response
   */
  async addDeveloperResponse(
    reviewId: string,
    developerId: string,
    response: string
  ): Promise<void> {
    // Verify the user is the module developer
    const { data: review } = await supabase
      .from('module_reviews')
      .select(`
        id,
        module:modules(created_by)
      `)
      .eq('id', reviewId)
      .single();

    if (!review || review.module?.created_by !== developerId) {
      throw new Error('Not authorized to respond to this review');
    }

    await supabase
      .from('module_reviews')
      .update({
        developer_response: response,
        developer_responded_at: new Date().toISOString()
      })
      .eq('id', reviewId);
  }

  /**
   * Vote on review helpfulness
   */
  async voteReview(
    reviewId: string,
    userId: string,
    voteType: 'helpful' | 'not_helpful'
  ): Promise<void> {
    // Check for existing vote
    const { data: existing } = await supabase
      .from('review_votes')
      .select('id, vote_type')
      .eq('review_id', reviewId)
      .eq('user_id', userId)
      .single();

    if (existing) {
      if (existing.vote_type === voteType) {
        // Remove vote
        await supabase
          .from('review_votes')
          .delete()
          .eq('id', existing.id);
      } else {
        // Update vote
        await supabase
          .from('review_votes')
          .update({ vote_type: voteType })
          .eq('id', existing.id);
      }
    } else {
      // New vote
      await supabase
        .from('review_votes')
        .insert({
          review_id: reviewId,
          user_id: userId,
          vote_type: voteType
        });
    }

    // Update helpful count
    const { count } = await supabase
      .from('review_votes')
      .select('*', { count: 'exact', head: true })
      .eq('review_id', reviewId)
      .eq('vote_type', 'helpful');

    await supabase
      .from('module_reviews')
      .update({ helpful_count: count || 0 })
      .eq('id', reviewId);
  }

  /**
   * Update module's aggregate rating
   */
  private async updateModuleRating(moduleId: string): Promise<void> {
    const stats = await this.getReviewStats(moduleId);

    await supabase
      .from('modules')
      .update({
        rating: stats.averageRating,
        review_count: stats.totalReviews
      })
      .eq('id', moduleId);
  }

  /**
   * Report a review
   */
  async reportReview(
    reviewId: string,
    userId: string,
    reason: string
  ): Promise<void> {
    await supabase
      .from('module_reviews')
      .update({
        report_count: supabase.rpc('increment', { row_id: reviewId, count: 1 }),
        status: 'flagged'
      })
      .eq('id', reviewId);

    // Log the report for moderation
    await supabase.from('moderation_reports').insert({
      type: 'review',
      target_id: reviewId,
      reported_by: userId,
      reason
    });
  }
}
```

---

### Task 3: Search & Discovery Service (2 hours)

```typescript
// src/lib/marketplace/search-service.ts

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface SearchResult {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  category: string;
  type: string;
  rating: number;
  review_count: number;
  install_count: number;
  price: number | null;
  developer: {
    name: string;
    slug: string;
    is_verified: boolean;
  };
  tags: string[];
  highlights?: {
    name?: string;
    description?: string;
  };
}

export interface SearchFilters {
  query?: string;
  category?: string;
  type?: string;
  priceMin?: number;
  priceMax?: number;
  minRating?: number;
  tags?: string[];
  developer?: string;
  isFree?: boolean;
  sortBy?: 'relevance' | 'popular' | 'newest' | 'rating' | 'price_low' | 'price_high';
}

export interface SearchResults {
  results: SearchResult[];
  total: number;
  page: number;
  totalPages: number;
  facets: {
    categories: { name: string; count: number }[];
    types: { name: string; count: number }[];
    priceRanges: { min: number; max: number; count: number }[];
    ratings: { rating: number; count: number }[];
  };
}

export class MarketplaceSearchService {
  /**
   * Search modules
   */
  async search(
    filters: SearchFilters,
    page = 1,
    limit = 20
  ): Promise<SearchResults> {
    const from = (page - 1) * limit;

    let query = supabase
      .from('modules')
      .select(`
        id,
        name,
        slug,
        description,
        icon,
        category,
        type,
        rating,
        review_count,
        install_count,
        price,
        tags,
        developer:developer_profiles!modules_created_by_fkey(
          display_name,
          slug,
          is_verified
        )
      `, { count: 'exact' })
      .eq('status', 'published');

    // Full-text search
    if (filters.query) {
      query = query.textSearch('fts', filters.query, {
        type: 'websearch',
        config: 'english'
      });
    }

    // Category filter
    if (filters.category) {
      query = query.eq('category', filters.category);
    }

    // Type filter
    if (filters.type) {
      query = query.eq('type', filters.type);
    }

    // Price filters
    if (filters.isFree) {
      query = query.or('price.is.null,price.eq.0');
    } else {
      if (filters.priceMin !== undefined) {
        query = query.gte('price', filters.priceMin);
      }
      if (filters.priceMax !== undefined) {
        query = query.lte('price', filters.priceMax);
      }
    }

    // Rating filter
    if (filters.minRating) {
      query = query.gte('rating', filters.minRating);
    }

    // Tags filter
    if (filters.tags && filters.tags.length > 0) {
      query = query.contains('tags', filters.tags);
    }

    // Developer filter
    if (filters.developer) {
      query = query.eq('developer_profiles.slug', filters.developer);
    }

    // Sorting
    switch (filters.sortBy) {
      case 'popular':
        query = query.order('install_count', { ascending: false });
        break;
      case 'newest':
        query = query.order('published_at', { ascending: false });
        break;
      case 'rating':
        query = query.order('rating', { ascending: false });
        break;
      case 'price_low':
        query = query.order('price', { ascending: true, nullsFirst: true });
        break;
      case 'price_high':
        query = query.order('price', { ascending: false });
        break;
      default:
        // Relevance (for text search, Supabase handles this)
        if (!filters.query) {
          query = query.order('install_count', { ascending: false });
        }
    }

    // Pagination
    query = query.range(from, from + limit - 1);

    const { data, count, error } = await query;

    if (error) throw error;

    // Get facets
    const facets = await this.getFacets(filters);

    return {
      results: (data || []).map(m => ({
        ...m,
        developer: m.developer?.[0] || { name: 'Unknown', slug: '', is_verified: false }
      })),
      total: count || 0,
      page,
      totalPages: Math.ceil((count || 0) / limit),
      facets
    };
  }

  /**
   * Get facets for filtering
   */
  private async getFacets(filters: SearchFilters): Promise<SearchResults['facets']> {
    // Get category counts
    const { data: categories } = await supabase
      .from('modules')
      .select('category')
      .eq('status', 'published')
      .then(({ data }) => {
        const counts: Record<string, number> = {};
        data?.forEach(m => {
          counts[m.category] = (counts[m.category] || 0) + 1;
        });
        return { data: Object.entries(counts).map(([name, count]) => ({ name, count })) };
      });

    // Get type counts
    const { data: types } = await supabase
      .from('modules')
      .select('type')
      .eq('status', 'published')
      .then(({ data }) => {
        const counts: Record<string, number> = {};
        data?.forEach(m => {
          counts[m.type] = (counts[m.type] || 0) + 1;
        });
        return { data: Object.entries(counts).map(([name, count]) => ({ name, count })) };
      });

    // Get rating distribution
    const { data: ratings } = await supabase
      .from('modules')
      .select('rating')
      .eq('status', 'published')
      .then(({ data }) => {
        const counts = [0, 0, 0, 0, 0];
        data?.forEach(m => {
          if (m.rating >= 4.5) counts[4]++;
          else if (m.rating >= 3.5) counts[3]++;
          else if (m.rating >= 2.5) counts[2]++;
          else if (m.rating >= 1.5) counts[1]++;
          else counts[0]++;
        });
        return { data: counts.map((count, i) => ({ rating: i + 1, count })) };
      });

    return {
      categories: categories || [],
      types: types || [],
      priceRanges: [
        { min: 0, max: 0, count: 0 },
        { min: 1, max: 25, count: 0 },
        { min: 25, max: 100, count: 0 },
        { min: 100, max: Infinity, count: 0 }
      ],
      ratings: ratings || []
    };
  }

  /**
   * Get featured modules
   */
  async getFeatured(placement: string): Promise<SearchResult[]> {
    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from('featured_modules')
      .select(`
        id,
        headline,
        description,
        custom_image_url,
        module:modules(
          id,
          name,
          slug,
          description,
          icon,
          category,
          type,
          rating,
          review_count,
          install_count,
          price,
          tags,
          developer:developer_profiles(
            display_name,
            slug,
            is_verified
          )
        )
      `)
      .eq('placement', placement)
      .eq('is_active', true)
      .lte('starts_at', now)
      .or(`ends_at.is.null,ends_at.gt.${now}`)
      .order('position');

    if (error) throw error;

    return (data || []).map(f => ({
      ...f.module,
      developer: f.module?.developer?.[0] || { name: 'Unknown', slug: '', is_verified: false },
      featuredHeadline: f.headline,
      featuredDescription: f.description
    }));
  }

  /**
   * Get recommendations for user
   */
  async getRecommendations(
    userId: string,
    limit = 10
  ): Promise<SearchResult[]> {
    // Get user's installed modules
    const { data: installed } = await supabase
      .from('site_modules')
      .select('module:modules(category, type, tags)')
      .eq('installed_by', userId);

    if (!installed || installed.length === 0) {
      // Return popular modules for new users
      const { data } = await supabase
        .from('modules')
        .select(`
          id, name, slug, description, icon, category, type,
          rating, review_count, install_count, price, tags,
          developer:developer_profiles(display_name, slug, is_verified)
        `)
        .eq('status', 'published')
        .order('install_count', { ascending: false })
        .limit(limit);

      return (data || []).map(m => ({
        ...m,
        developer: m.developer?.[0] || { name: 'Unknown', slug: '', is_verified: false }
      }));
    }

    // Extract preferences
    const categories = new Set<string>();
    const types = new Set<string>();
    const tags = new Set<string>();

    installed.forEach(i => {
      if (i.module?.category) categories.add(i.module.category);
      if (i.module?.type) types.add(i.module.type);
      i.module?.tags?.forEach((t: string) => tags.add(t));
    });

    // Get installed module IDs to exclude
    const { data: installedIds } = await supabase
      .from('site_modules')
      .select('module_id')
      .eq('installed_by', userId);

    const excludeIds = (installedIds || []).map(i => i.module_id);

    // Find similar modules
    let query = supabase
      .from('modules')
      .select(`
        id, name, slug, description, icon, category, type,
        rating, review_count, install_count, price, tags,
        developer:developer_profiles(display_name, slug, is_verified)
      `)
      .eq('status', 'published')
      .not('id', 'in', `(${excludeIds.join(',')})`)
      .limit(limit);

    if (categories.size > 0) {
      query = query.in('category', Array.from(categories));
    }

    const { data, error } = await query.order('rating', { ascending: false });

    if (error) throw error;

    return (data || []).map(m => ({
      ...m,
      developer: m.developer?.[0] || { name: 'Unknown', slug: '', is_verified: false }
    }));
  }

  /**
   * Log search for analytics
   */
  async logSearch(
    userId: string | null,
    query: string,
    filters: SearchFilters,
    resultCount: number
  ): Promise<void> {
    if (!userId) return;

    await supabase.from('user_search_history').insert({
      user_id: userId,
      query,
      filters,
      result_count: resultCount
    });
  }

  /**
   * Log module view
   */
  async logView(
    moduleId: string,
    userId: string | null,
    sessionId: string
  ): Promise<void> {
    await supabase.from('module_views').insert({
      module_id: moduleId,
      user_id: userId,
      session_id: sessionId
    });
  }

  /**
   * Get trending modules
   */
  async getTrending(limit = 10): Promise<SearchResult[]> {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    // Get modules with most views in past week
    const { data, error } = await supabase
      .rpc('get_trending_modules', {
        since_date: weekAgo.toISOString(),
        limit_count: limit
      });

    if (error) throw error;

    return data || [];
  }
}
```

---

### Task 4: Marketplace UI Components (3 hours)

```tsx
// src/components/marketplace/ModuleCard.tsx

'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Star, Download, Shield, Sparkles } from 'lucide-react';
import { Card, CardContent, Badge } from '@/components/ui';

interface ModuleCardProps {
  module: {
    id: string;
    name: string;
    slug: string;
    description: string;
    icon: string;
    category: string;
    type: string;
    rating: number;
    review_count: number;
    install_count: number;
    price: number | null;
    developer: {
      name: string;
      slug: string;
      is_verified: boolean;
    };
    tags: string[];
  };
  featured?: boolean;
}

export function ModuleCard({ module, featured }: ModuleCardProps) {
  return (
    <Link href={`/marketplace/modules/${module.slug}`}>
      <Card className={`h-full hover:shadow-lg transition-shadow ${featured ? 'border-2 border-primary' : ''}`}>
        <CardContent className="p-4">
          {/* Header */}
          <div className="flex items-start gap-3 mb-3">
            <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center text-2xl">
              {module.icon}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold truncate">{module.name}</h3>
              <Link 
                href={`/marketplace/developers/${module.developer.slug}`}
                className="text-sm text-muted-foreground hover:underline flex items-center gap-1"
                onClick={(e) => e.stopPropagation()}
              >
                {module.developer.name}
                {module.developer.is_verified && (
                  <Shield className="h-3 w-3 text-blue-500" />
                )}
              </Link>
            </div>
            {featured && (
              <Badge variant="default" className="shrink-0">
                <Sparkles className="h-3 w-3 mr-1" />
                Featured
              </Badge>
            )}
          </div>

          {/* Description */}
          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
            {module.description}
          </p>

          {/* Stats */}
          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
              <span>{module.rating.toFixed(1)}</span>
              <span className="text-xs">({module.review_count})</span>
            </div>
            <div className="flex items-center gap-1">
              <Download className="h-4 w-4" />
              <span>{module.install_count.toLocaleString()}</span>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between">
            <div className="flex gap-1">
              <Badge variant="outline" className="text-xs">
                {module.type}
              </Badge>
              <Badge variant="secondary" className="text-xs">
                {module.category}
              </Badge>
            </div>
            <div className="font-semibold">
              {module.price ? `$${module.price}/mo` : 'Free'}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
```

```tsx
// src/components/marketplace/ReviewList.tsx

'use client';

import { useState } from 'react';
import { Star, ThumbsUp, MessageCircle, Flag, ChevronDown } from 'lucide-react';
import {
  Card,
  CardContent,
  Button,
  Avatar,
  Badge,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Progress
} from '@/components/ui';

interface Review {
  id: string;
  rating: number;
  title: string | null;
  content: string | null;
  pros: string[];
  cons: string[];
  developer_response: string | null;
  is_verified_purchase: boolean;
  helpful_count: number;
  created_at: string;
  user: {
    name: string;
    avatar_url: string;
  };
}

interface ReviewListProps {
  moduleId: string;
  reviews: Review[];
  stats: {
    averageRating: number;
    totalReviews: number;
    distribution: Record<number, number>;
  };
  onVote: (reviewId: string, voteType: 'helpful' | 'not_helpful') => void;
  onSort: (sortBy: string) => void;
  onFilter: (rating: number | null) => void;
}

export function ReviewList({
  moduleId,
  reviews,
  stats,
  onVote,
  onSort,
  onFilter
}: ReviewListProps) {
  const [filterRating, setFilterRating] = useState<number | null>(null);

  function renderStars(rating: number) {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((i) => (
          <Star
            key={i}
            className={`h-4 w-4 ${
              i <= rating 
                ? 'text-yellow-500 fill-yellow-500' 
                : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  }

  const maxCount = Math.max(...Object.values(stats.distribution));

  return (
    <div className="space-y-6">
      {/* Summary */}
      <Card>
        <CardContent className="p-6">
          <div className="flex gap-8">
            {/* Average Rating */}
            <div className="text-center">
              <div className="text-5xl font-bold">{stats.averageRating.toFixed(1)}</div>
              <div className="mt-2">{renderStars(Math.round(stats.averageRating))}</div>
              <div className="text-sm text-muted-foreground mt-1">
                {stats.totalReviews} reviews
              </div>
            </div>

            {/* Distribution */}
            <div className="flex-1 space-y-2">
              {[5, 4, 3, 2, 1].map((rating) => (
                <button
                  key={rating}
                  onClick={() => {
                    const newFilter = filterRating === rating ? null : rating;
                    setFilterRating(newFilter);
                    onFilter(newFilter);
                  }}
                  className={`w-full flex items-center gap-2 hover:bg-muted p-1 rounded ${
                    filterRating === rating ? 'bg-muted' : ''
                  }`}
                >
                  <span className="w-3 text-sm">{rating}</span>
                  <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                  <Progress 
                    value={maxCount > 0 ? (stats.distribution[rating] / maxCount) * 100 : 0} 
                    className="h-2 flex-1"
                  />
                  <span className="w-8 text-sm text-muted-foreground text-right">
                    {stats.distribution[rating]}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Controls */}
      <div className="flex items-center justify-between">
        <Select defaultValue="newest" onValueChange={onSort}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest First</SelectItem>
            <SelectItem value="oldest">Oldest First</SelectItem>
            <SelectItem value="highest">Highest Rated</SelectItem>
            <SelectItem value="lowest">Lowest Rated</SelectItem>
            <SelectItem value="helpful">Most Helpful</SelectItem>
          </SelectContent>
        </Select>

        {filterRating && (
          <Button variant="ghost" size="sm" onClick={() => {
            setFilterRating(null);
            onFilter(null);
          }}>
            Clear filter
          </Button>
        )}
      </div>

      {/* Reviews */}
      <div className="space-y-4">
        {reviews.map((review) => (
          <Card key={review.id}>
            <CardContent className="p-4">
              {/* Header */}
              <div className="flex items-start gap-3 mb-3">
                <Avatar>
                  <img src={review.user.avatar_url || '/default-avatar.png'} alt="" />
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{review.user.name}</span>
                    {review.is_verified_purchase && (
                      <Badge variant="outline" className="text-xs">
                        Verified
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    {renderStars(review.rating)}
                    <span className="text-sm text-muted-foreground">
                      {new Date(review.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Content */}
              {review.title && (
                <h4 className="font-medium mb-2">{review.title}</h4>
              )}
              
              {review.content && (
                <p className="text-sm mb-3">{review.content}</p>
              )}

              {/* Pros/Cons */}
              {(review.pros.length > 0 || review.cons.length > 0) && (
                <div className="grid grid-cols-2 gap-4 mb-3 text-sm">
                  {review.pros.length > 0 && (
                    <div>
                      <div className="font-medium text-green-600 mb-1">Pros</div>
                      <ul className="list-disc list-inside text-muted-foreground">
                        {review.pros.map((pro, i) => (
                          <li key={i}>{pro}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {review.cons.length > 0 && (
                    <div>
                      <div className="font-medium text-red-600 mb-1">Cons</div>
                      <ul className="list-disc list-inside text-muted-foreground">
                        {review.cons.map((con, i) => (
                          <li key={i}>{con}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Developer Response */}
              {review.developer_response && (
                <Collapsible className="mt-3">
                  <CollapsibleTrigger className="flex items-center gap-2 text-sm text-primary">
                    <MessageCircle className="h-4 w-4" />
                    Developer Response
                    <ChevronDown className="h-4 w-4" />
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-2 p-3 bg-muted rounded-md">
                    <p className="text-sm">{review.developer_response}</p>
                  </CollapsibleContent>
                </Collapsible>
              )}

              {/* Actions */}
              <div className="flex items-center gap-4 mt-3 pt-3 border-t">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onVote(review.id, 'helpful')}
                  className="text-muted-foreground"
                >
                  <ThumbsUp className="h-4 w-4 mr-1" />
                  Helpful ({review.helpful_count})
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground"
                >
                  <Flag className="h-4 w-4 mr-1" />
                  Report
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
```

---

### Task 5: Developer Profile Page (2 hours)

```tsx
// src/app/(dashboard)/marketplace/developers/[slug]/page.tsx

import { createServerClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { 
  Shield, 
  Globe, 
  Github, 
  Twitter, 
  Linkedin,
  Star,
  Download,
  Package,
  MessageSquare
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Badge,
  Avatar,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from '@/components/ui';
import { ModuleCard } from '@/components/marketplace/ModuleCard';

interface Props {
  params: { slug: string };
}

export default async function DeveloperProfilePage({ params }: Props) {
  const supabase = await createServerClient();

  const { data: developer } = await supabase
    .from('developer_profiles')
    .select(`
      *,
      user:users(email)
    `)
    .eq('slug', params.slug)
    .single();

  if (!developer) {
    notFound();
  }

  const { data: modules } = await supabase
    .from('modules')
    .select(`
      id, name, slug, description, icon, category, type,
      rating, review_count, install_count, price, tags
    `)
    .eq('created_by', developer.user_id)
    .eq('status', 'published')
    .order('install_count', { ascending: false });

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Profile Header */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Avatar */}
            <div className="shrink-0">
              <Avatar className="w-24 h-24">
                {developer.avatar_url ? (
                  <img src={developer.avatar_url} alt={developer.display_name} />
                ) : (
                  <div className="w-full h-full bg-primary flex items-center justify-center text-3xl text-white">
                    {developer.display_name[0]}
                  </div>
                )}
              </Avatar>
            </div>

            {/* Info */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold">{developer.display_name}</h1>
                {developer.is_verified && (
                  <Badge className="bg-blue-500">
                    <Shield className="h-3 w-3 mr-1" />
                    Verified
                  </Badge>
                )}
              </div>

              {developer.bio && (
                <p className="text-muted-foreground mb-4">{developer.bio}</p>
              )}

              {/* Links */}
              <div className="flex flex-wrap gap-3">
                {developer.website_url && (
                  <a 
                    href={developer.website_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary"
                  >
                    <Globe className="h-4 w-4" />
                    Website
                  </a>
                )}
                {developer.github_url && (
                  <a 
                    href={developer.github_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary"
                  >
                    <Github className="h-4 w-4" />
                    GitHub
                  </a>
                )}
                {developer.twitter_url && (
                  <a 
                    href={developer.twitter_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary"
                  >
                    <Twitter className="h-4 w-4" />
                    Twitter
                  </a>
                )}
                {developer.linkedin_url && (
                  <a 
                    href={developer.linkedin_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary"
                  >
                    <Linkedin className="h-4 w-4" />
                    LinkedIn
                  </a>
                )}
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-muted rounded-lg">
                <Package className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
                <div className="text-2xl font-bold">{developer.total_modules}</div>
                <div className="text-xs text-muted-foreground">Modules</div>
              </div>
              <div className="text-center p-3 bg-muted rounded-lg">
                <Download className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
                <div className="text-2xl font-bold">
                  {developer.total_downloads.toLocaleString()}
                </div>
                <div className="text-xs text-muted-foreground">Downloads</div>
              </div>
              <div className="text-center p-3 bg-muted rounded-lg">
                <Star className="h-5 w-5 mx-auto mb-1 text-yellow-500" />
                <div className="text-2xl font-bold">{developer.avg_rating.toFixed(1)}</div>
                <div className="text-xs text-muted-foreground">Avg Rating</div>
              </div>
              <div className="text-center p-3 bg-muted rounded-lg">
                <MessageSquare className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
                <div className="text-2xl font-bold">{developer.total_reviews}</div>
                <div className="text-xs text-muted-foreground">Reviews</div>
              </div>
            </div>
          </div>

          {/* Custom Request CTA */}
          {developer.accepts_custom_requests && (
            <div className="mt-6 p-4 bg-primary/10 rounded-lg flex items-center justify-between">
              <div>
                <h3 className="font-medium">Need a Custom Module?</h3>
                <p className="text-sm text-muted-foreground">
                  This developer accepts custom requests
                  {developer.custom_request_rate && (
                    <> starting at ${developer.custom_request_rate}/hr</>
                  )}
                </p>
              </div>
              <Button>Request Custom Module</Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modules */}
      <Tabs defaultValue="modules">
        <TabsList>
          <TabsTrigger value="modules">
            <Package className="h-4 w-4 mr-2" />
            Modules ({modules?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="reviews">
            <MessageSquare className="h-4 w-4 mr-2" />
            Reviews
          </TabsTrigger>
        </TabsList>

        <TabsContent value="modules" className="mt-6">
          {modules && modules.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {modules.map((module) => (
                <ModuleCard 
                  key={module.id} 
                  module={{
                    ...module,
                    developer: {
                      name: developer.display_name,
                      slug: developer.slug,
                      is_verified: developer.is_verified
                    }
                  }} 
                />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">No Published Modules</h3>
                <p className="text-muted-foreground">
                  This developer hasn't published any modules yet.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="reviews" className="mt-6">
          <Card>
            <CardContent className="p-6">
              <p className="text-center text-muted-foreground">
                Reviews across all modules from this developer
              </p>
              {/* Add consolidated reviews list here */}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

---

## ✅ Verification Checklist

- [ ] Reviews create correctly
- [ ] Ratings calculate properly
- [ ] Developer profiles display
- [ ] Search returns relevant results
- [ ] Facets update correctly
- [ ] Featured modules show
- [ ] Recommendations work
- [ ] Helpful votes track
- [ ] Developer responses save
- [ ] Collections curate properly

---

## 📍 Dependencies

- **Requires**: EM-01, EM-02, EM-03
- **Required by**: Revenue sharing, developer ecosystem
