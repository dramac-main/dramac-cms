// src/lib/modules/marketplace-search.ts
// Full-text search service for module marketplace

import { createClient } from '@/lib/supabase/client';
import { DEFAULT_CURRENCY_SYMBOL } from '@/lib/locale-config';
import type { ModuleCategory } from './module-categories';

// ============================================================================
// TYPES
// ============================================================================

export interface MarketplaceFilters {
  query?: string;
  categories?: ModuleCategory[];
  priceRange?: 'free' | 'paid' | 'all';
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  sortBy?: 'relevance' | 'popular' | 'newest' | 'rating' | 'price-low' | 'price-high';
  moduleType?: 'widget' | 'app' | 'integration' | 'system' | 'all';
  installLevel?: 'platform' | 'agency' | 'client' | 'site' | 'all';
  page?: number;
  limit?: number;
}

export interface MarketplaceSearchResult {
  modules: ModuleListItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  facets: SearchFacets;
}

export interface ModuleListItem {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  icon: string | null;
  category: string;
  module_type: string | null;
  pricing_type: string;
  wholesale_price_monthly: number | null;
  wholesale_price_yearly: number | null;
  rating_average: number | null;
  rating_count: number | null;
  install_count: number | null;
  is_featured: boolean;
  author_name: string | null;
  author_verified: boolean | null;
  // Badge-related fields
  source?: string | null;           // 'catalog' or 'studio'
  status?: string | null;           // 'active', 'testing', 'published', etc.
  install_level?: string | null;    // 'platform', 'agency', 'client', 'site'
  studio_module_id?: string | null; // For studio modules
  screenshots: string[];
  published_at: string | null;
}

export interface SearchFacets {
  categories: { category: string; count: number }[];
  priceRanges: { range: string; count: number }[];
  ratings: { rating: number; count: number }[];
  moduleTypes: { type: string; count: number }[];
}

export interface ModuleCollection {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  icon: string | null;
  banner_image: string | null;
  display_order: number;
  is_visible: boolean;
  items: {
    module: ModuleListItem;
  }[];
}

export interface ModuleReview {
  id: string;
  rating: number;
  comment: string | null;
  title: string | null;
  created_at: string;
  helpful_count: number;
  verified_purchase: boolean;
  agency_name: string | null;
  response: string | null;
  response_at: string | null;
  user_id: string;
}

export interface ModuleDetails extends ModuleListItem {
  long_description: string | null;
  features: string[];
  tags: string[];
  requirements: string[] | null;
  changelog: { version: string; date: string; changes: string[] }[] | null;
  documentation_url: string | null;
  support_url: string | null;
  render_code: string | null;
  styles: string | null;
  settings_schema: Record<string, unknown> | null;
  default_settings: Record<string, unknown> | null;
  reviews: ModuleReview[];
  created_at: string;
  updated_at: string;
}

// ============================================================================
// SEARCH FUNCTIONS
// ============================================================================

/**
 * Check if current user's agency is enrolled in beta program
 */
async function checkBetaEnrollment(supabase: ReturnType<typeof createClient>): Promise<{
  isBeta: boolean;
  hasTestSites: boolean;
}> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { isBeta: false, hasTestSites: false };

    const { data: profile } = await supabase
      .from('profiles')
      .select('agency_id')
      .eq('id', user.id)
      .single();

    if (!profile?.agency_id) return { isBeta: false, hasTestSites: false };

    // Check beta enrollment
    const { data: betaEnrollment } = await supabase
      .from('beta_enrollment')
      .select('id, is_active')
      .eq('agency_id', profile.agency_id)
      .eq('is_active', true)
      .single();

    // Check test sites
    const { data: testSites } = await supabase
      .from('test_site_configuration')
      .select('site_id, sites!inner(agency_id)')
      .eq('is_active', true)
      .eq('sites.agency_id', profile.agency_id)
      .limit(1);

    return {
      isBeta: !!betaEnrollment,
      hasTestSites: (testSites && testSites.length > 0) || false
    };
  } catch {
    return { isBeta: false, hasTestSites: false };
  }
}

/**
 * Fetch testing modules from module_source for beta users
 */
async function fetchTestingModules(
  supabase: ReturnType<typeof createClient>,
  filters: MarketplaceFilters
): Promise<ModuleListItem[]> {
  const { query, categories } = filters;

  let testingQuery = supabase
    .from('module_source')
    .select('*')
    .eq('status', 'testing')
    .in('testing_tier', ['beta', 'public']); // Only beta/public tier, not internal

  if (query && query.trim()) {
    testingQuery = testingQuery.or(`name.ilike.%${query}%,description.ilike.%${query}%`);
  }

  if (categories && categories.length > 0) {
    testingQuery = testingQuery.in('category', categories);
  }

  const { data: testingModules } = await testingQuery;

  // Convert to ModuleListItem format
  return (testingModules || []).map((m: any) => ({
    id: m.id,
    slug: m.slug,
    name: m.name,
    description: m.description,
    icon: m.icon || '📦',
    category: m.category || 'other',
    module_type: m.module_type || 'widget',
    pricing_type: 'free', // Testing modules are free
    wholesale_price_monthly: 0,
    wholesale_price_yearly: 0,
    rating_average: null,
    rating_count: null,
    install_count: 0,
    is_featured: false,
    author_name: m.author_name || 'DRAMAC Studio',
    author_verified: true,
    source: 'studio',
    status: 'testing', // Important for Beta badge
    install_level: 'site',
    studio_module_id: m.id,
    screenshots: [],
    published_at: m.created_at
  }));
}

/**
 * Search marketplace modules with filters, full-text search, and pagination
 * Includes testing/beta modules for enrolled agencies
 */
export async function searchMarketplace(
  filters: MarketplaceFilters
): Promise<MarketplaceSearchResult> {
  const supabase = createClient();
  const {
    query,
    categories,
    priceRange = 'all',
    minPrice,
    maxPrice,
    minRating,
    sortBy = 'popular',
    moduleType = 'all',
    installLevel = 'all',
    page = 1,
    limit = 20
  } = filters;

  // Check beta enrollment for testing modules access
  const { isBeta, hasTestSites } = await checkBetaEnrollment(supabase);
  const canSeeTestingModules = isBeta || hasTestSites;

  // Build base query - include source, status, install_level for badges
  let dbQuery = supabase
    .from('modules_v2')
    .select(`
      id, slug, name, description, icon, category, module_type,
      pricing_type, wholesale_price_monthly, wholesale_price_yearly,
      rating_average, rating_count, install_count, is_featured,
      author_name, author_verified, screenshots, published_at,
      source, status, install_level, studio_module_id
    `, { count: 'exact' })
    .eq('status', 'active');

  // Full-text search
  if (query && query.trim()) {
    // Use textSearch for PostgreSQL full-text search
    dbQuery = dbQuery.textSearch('search_vector', query, {
      type: 'websearch',
      config: 'english'
    });
  }

  // Category filter
  if (categories && categories.length > 0) {
    dbQuery = dbQuery.in('category', categories);
  }

  // Price filter
  if (priceRange === 'free') {
    dbQuery = dbQuery.eq('pricing_type', 'free');
  } else if (priceRange === 'paid') {
    dbQuery = dbQuery.neq('pricing_type', 'free');
  }

  // Price range filter
  if (minPrice !== undefined && minPrice > 0) {
    dbQuery = dbQuery.gte('wholesale_price_monthly', minPrice);
  }
  if (maxPrice !== undefined && maxPrice > 0) {
    dbQuery = dbQuery.lte('wholesale_price_monthly', maxPrice);
  }

  // Rating filter
  if (minRating && minRating > 0) {
    dbQuery = dbQuery.gte('rating_average', minRating);
  }

  // Module type filter
  if (moduleType && moduleType !== 'all') {
    dbQuery = dbQuery.eq('module_type', moduleType);
  }

  // Install level filter
  if (installLevel && installLevel !== 'all') {
    dbQuery = dbQuery.eq('install_level', installLevel);
  }

  // Sorting
  switch (sortBy) {
    case 'popular':
      dbQuery = dbQuery
        .order('is_featured', { ascending: false })
        .order('install_count', { ascending: false, nullsFirst: false });
      break;
    case 'newest':
      dbQuery = dbQuery.order('published_at', { ascending: false, nullsFirst: false });
      break;
    case 'rating':
      dbQuery = dbQuery
        .order('rating_average', { ascending: false, nullsFirst: false })
        .order('rating_count', { ascending: false, nullsFirst: false });
      break;
    case 'price-low':
      dbQuery = dbQuery.order('wholesale_price_monthly', { ascending: true, nullsFirst: false });
      break;
    case 'price-high':
      dbQuery = dbQuery.order('wholesale_price_monthly', { ascending: false, nullsFirst: false });
      break;
    case 'relevance':
    default:
      // For relevance, PostgreSQL orders by ts_rank automatically with textSearch
      // Fall back to popularity if no query
      if (!query) {
        dbQuery = dbQuery
          .order('is_featured', { ascending: false })
          .order('install_count', { ascending: false, nullsFirst: false });
      }
  }

  // Pagination
  const offset = (page - 1) * limit;
  dbQuery = dbQuery.range(offset, offset + limit - 1);

  const { data, count, error } = await dbQuery;

  if (error) {
    console.error('[MarketplaceSearch] Error:', error);
    throw error;
  }

  // Merge testing modules if user has access
  let allModules = (data || []) as ModuleListItem[];
  let totalCount = count || 0;

  if (canSeeTestingModules) {
    const testingModules = await fetchTestingModules(supabase, filters);
    
    // Deduplicate by slug (prefer testing version if exists in both)
    const testingSlugs = new Set(testingModules.map(m => m.slug));
    const filteredModules = allModules.filter(m => !testingSlugs.has(m.slug));
    
    // Apply price filter to testing modules (they're all free)
    let filteredTestingModules = testingModules;
    if (priceRange === 'paid') {
      filteredTestingModules = []; // Testing modules are free, exclude if paid filter
    }
    
    // Combine and sort
    allModules = [...filteredModules, ...filteredTestingModules];
    totalCount = allModules.length;
    
    // Re-apply sorting after merge
    if (sortBy === 'popular' || sortBy === 'relevance') {
      allModules.sort((a, b) => {
        if (a.is_featured !== b.is_featured) return a.is_featured ? -1 : 1;
        return (b.install_count || 0) - (a.install_count || 0);
      });
    } else if (sortBy === 'newest') {
      allModules.sort((a, b) => {
        const dateA = a.published_at ? new Date(a.published_at).getTime() : 0;
        const dateB = b.published_at ? new Date(b.published_at).getTime() : 0;
        return dateB - dateA;
      });
    }
    
    // Apply pagination to merged results
    const offset = (page - 1) * limit;
    allModules = allModules.slice(offset, offset + limit);
  }

  // Get facets for filters
  const facets = await getSearchFacets(supabase);

  return {
    modules: allModules,
    total: totalCount,
    page,
    limit,
    totalPages: Math.ceil(totalCount / limit),
    facets
  };
}

/**
 * Get search facets (category counts, price ranges, etc.)
 */
async function getSearchFacets(supabase: ReturnType<typeof createClient>): Promise<SearchFacets> {
  // Get category counts
  const { data: modules } = await supabase
    .from('modules_v2')
    .select('category, pricing_type, rating_average, module_type')
    .eq('status', 'active');

  const categoryMap = new Map<string, number>();
  const priceRangeMap = new Map<string, number>();
  const ratingMap = new Map<number, number>();
  const moduleTypeMap = new Map<string, number>();

  (modules || []).forEach((m) => {
    // Categories
    if (m.category) {
      categoryMap.set(m.category, (categoryMap.get(m.category) || 0) + 1);
    }

    // Price ranges
    if (m.pricing_type === 'free') {
      priceRangeMap.set('free', (priceRangeMap.get('free') || 0) + 1);
    } else {
      priceRangeMap.set('paid', (priceRangeMap.get('paid') || 0) + 1);
    }

    // Ratings (rounded down)
    if (m.rating_average) {
      const rating = Math.floor(m.rating_average);
      if (rating >= 3) {
        ratingMap.set(rating, (ratingMap.get(rating) || 0) + 1);
      }
    }

    // Module types
    if (m.module_type) {
      moduleTypeMap.set(m.module_type, (moduleTypeMap.get(m.module_type) || 0) + 1);
    }
  });

  return {
    categories: Array.from(categoryMap.entries())
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count),
    priceRanges: [
      { range: 'free', count: priceRangeMap.get('free') || 0 },
      { range: 'paid', count: priceRangeMap.get('paid') || 0 }
    ],
    ratings: [5, 4, 3].map(rating => ({
      rating,
      count: ratingMap.get(rating) || 0
    })),
    moduleTypes: Array.from(moduleTypeMap.entries())
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count)
  };
}

// ============================================================================
// COLLECTION FUNCTIONS
// ============================================================================

/**
 * Get all visible featured collections with their modules
 */
export async function getFeaturedCollections(): Promise<ModuleCollection[]> {
  const supabase = createClient();
  
  // Use type assertion for new table (will be created by migration)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('module_collections')
    .select(`
      id, slug, name, description, icon, banner_image, display_order, is_visible,
      items:module_collection_items(
        module:modules_v2(
          id, slug, name, description, icon, category, module_type,
          pricing_type, wholesale_price_monthly, wholesale_price_yearly,
          rating_average, rating_count, install_count, is_featured,
          author_name, author_verified, screenshots, published_at
        )
      )
    `)
    .eq('is_visible', true)
    .order('display_order');

  if (error) {
    console.error('[MarketplaceSearch] Error fetching collections:', error);
    throw error;
  }

  // Filter out null modules and transform
  return ((data as ModuleCollection[]) || []).map(collection => ({
    ...collection,
    items: (collection.items || [])
      .filter((item: { module: ModuleListItem | null }) => item.module !== null)
      .map((item: { module: ModuleListItem }) => ({
        module: item.module
      }))
  }));
}

/**
 * Get a single collection by slug
 */
export async function getCollectionBySlug(slug: string): Promise<ModuleCollection | null> {
  const supabase = createClient();
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('module_collections')
    .select(`
      id, slug, name, description, icon, banner_image, display_order, is_visible,
      items:module_collection_items(
        module:modules_v2(
          id, slug, name, description, icon, category, module_type,
          pricing_type, wholesale_price_monthly, wholesale_price_yearly,
          rating_average, rating_count, install_count, is_featured,
          author_name, author_verified, screenshots, published_at
        )
      )
    `)
    .eq('slug', slug)
    .eq('is_visible', true)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // Not found
    console.error('[MarketplaceSearch] Error fetching collection:', error);
    throw error;
  }

  const collection = data as ModuleCollection;
  return {
    ...collection,
    items: (collection.items || [])
      .filter((item: { module: ModuleListItem | null }) => item.module !== null)
      .map((item: { module: ModuleListItem }) => ({
        module: item.module
      }))
  };
}

// ============================================================================
// MODULE DETAILS FUNCTIONS
// ============================================================================

/**
 * Get full module details by slug or ID
 */
export async function getModuleDetails(slugOrId: string): Promise<ModuleDetails | null> {
  const supabase = createClient();
  
  // First get the module
  let query = supabase
    .from('modules_v2')
    .select('*')
    .eq('status', 'active');

  // Check if it's a UUID format
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slugOrId);
  
  if (isUUID) {
    query = query.eq('id', slugOrId);
  } else {
    query = query.eq('slug', slugOrId);
  }

  const { data, error } = await query.single();

  if (error) {
    if (error.code === 'PGRST116') return null; // Not found
    console.error('[MarketplaceSearch] Error fetching module:', error);
    throw error;
  }

  // Get reviews separately (new columns from migration may not be in types yet)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: reviews } = await (supabase as any)
    .from('module_reviews')
    .select('id, rating, comment, title, created_at, helpful_count, verified_purchase, agency_name, response, response_at, user_id')
    .eq('module_id', data.id)
    .order('created_at', { ascending: false });

  // Track view (fire and forget)
  trackModuleView(data.id).catch(console.error);

  return {
    ...data,
    reviews: (reviews || []) as ModuleReview[]
  } as unknown as ModuleDetails;
}

/**
 * Get related modules based on category and tags
 */
export async function getRelatedModules(
  moduleId: string,
  category: string,
  limit = 4
): Promise<ModuleListItem[]> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('modules_v2')
    .select(`
      id, slug, name, description, icon, category, module_type,
      pricing_type, wholesale_price_monthly, wholesale_price_yearly,
      rating_average, rating_count, install_count, is_featured,
      author_name, author_verified, screenshots, published_at
    `)
    .eq('status', 'active')
    .eq('category', category)
    .neq('id', moduleId)
    .order('install_count', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('[MarketplaceSearch] Error fetching related modules:', error);
    return [];
  }

  return (data || []) as ModuleListItem[];
}

// ============================================================================
// STATS TRACKING
// ============================================================================

/**
 * Track a module view
 */
export async function trackModuleView(moduleId: string): Promise<void> {
  const supabase = createClient();
  const today = new Date().toISOString().split('T')[0];
  
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).rpc('increment_module_stat', {
      p_module_id: moduleId,
      p_date: today,
      p_field: 'views'
    });
  } catch (error) {
    console.error('[MarketplaceSearch] Error tracking view:', error);
  }
}

/**
 * Track a module install
 */
export async function trackModuleInstall(moduleId: string): Promise<void> {
  const supabase = createClient();
  const today = new Date().toISOString().split('T')[0];
  
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).rpc('increment_module_stat', {
      p_module_id: moduleId,
      p_date: today,
      p_field: 'installs'
    });
  } catch (error) {
    console.error('[MarketplaceSearch] Error tracking install:', error);
  }
}

/**
 * Track a module uninstall
 */
export async function trackModuleUninstall(moduleId: string): Promise<void> {
  const supabase = createClient();
  const today = new Date().toISOString().split('T')[0];
  
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).rpc('increment_module_stat', {
      p_module_id: moduleId,
      p_date: today,
      p_field: 'uninstalls'
    });
  } catch (error) {
    console.error('[MarketplaceSearch] Error tracking uninstall:', error);
  }
}

// ============================================================================
// REVIEW FUNCTIONS
// ============================================================================

/**
 * Submit a module review
 */
export async function submitModuleReview(
  moduleId: string,
  rating: number,
  comment?: string,
  title?: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }

  // Check if user already reviewed this module
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: existing } = await (supabase as any)
    .from('module_reviews')
    .select('id')
    .eq('module_id', moduleId)
    .eq('user_id', user.id)
    .single();

  if (existing) {
    // Update existing review
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from('module_reviews')
      .update({
        rating,
        comment,
        title,
        updated_at: new Date().toISOString()
      })
      .eq('id', existing.id);

    if (error) {
      return { success: false, error: error.message };
    }
  } else {
    // Create new review
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from('module_reviews')
      .insert({
        module_id: moduleId,
        user_id: user.id,
        rating,
        comment,
        title
      });

    if (error) {
      return { success: false, error: error.message };
    }
  }

  // Update module rating average
  await updateModuleRating(moduleId);

  return { success: true };
}

/**
 * Vote on a review helpfulness
 */
export async function voteOnReview(
  reviewId: string,
  isHelpful: boolean
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('module_review_votes')
    .upsert({
      review_id: reviewId,
      user_id: user.id,
      is_helpful: isHelpful
    }, {
      onConflict: 'review_id,user_id'
    });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * Update module rating average after a review
 */
async function updateModuleRating(moduleId: string): Promise<void> {
  const supabase = createClient();
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: reviews } = await (supabase as any)
    .from('module_reviews')
    .select('rating')
    .eq('module_id', moduleId);

  if (!reviews || reviews.length === 0) return;

  const sum = reviews.reduce((acc: number, r: { rating: number }) => acc + r.rating, 0);
  const average = sum / reviews.length;

  await supabase
    .from('modules_v2')
    .update({
      rating_average: Math.round(average * 10) / 10,
      rating_count: reviews.length
    })
    .eq('id', moduleId);
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Format price in cents to display string
 */
export function formatModulePrice(cents: number | null): string {
  if (cents === null || cents === 0) return 'Free';
  return `${DEFAULT_CURRENCY_SYMBOL}${(cents / 100).toFixed(2)}`;
}

/**
 * Get trending modules (most installs in last 7 days)
 */
export async function getTrendingModules(limit = 6): Promise<ModuleListItem[]> {
  const supabase = createClient();
  
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  
  // Get modules with most installs in last 7 days
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: stats } = await (supabase as any)
    .from('module_stats_daily')
    .select('module_id, installs')
    .gte('stat_date', sevenDaysAgo.toISOString().split('T')[0])
    .order('installs', { ascending: false })
    .limit(limit * 2); // Get more to account for possible inactive modules

  if (!stats || stats.length === 0) {
    // Fall back to most popular overall
    const { data } = await supabase
      .from('modules_v2')
      .select(`
        id, slug, name, description, icon, category, module_type,
        pricing_type, wholesale_price_monthly, wholesale_price_yearly,
        rating_average, rating_count, install_count, is_featured,
        author_name, author_verified, screenshots, published_at
      `)
      .eq('status', 'active')
      .order('install_count', { ascending: false })
      .limit(limit);
    
    return (data || []) as ModuleListItem[];
  }

  // Aggregate installs by module
  const moduleInstalls = new Map<string, number>();
  (stats as { module_id: string; installs: number }[]).forEach(s => {
    moduleInstalls.set(
      s.module_id,
      (moduleInstalls.get(s.module_id) || 0) + s.installs
    );
  });

  // Sort and get top module IDs
  const topModuleIds = Array.from(moduleInstalls.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([id]) => id);

  if (topModuleIds.length === 0) return [];

  // Fetch module details
  const { data } = await supabase
    .from('modules_v2')
    .select(`
      id, slug, name, description, icon, category, module_type,
      pricing_type, wholesale_price_monthly, wholesale_price_yearly,
      rating_average, rating_count, install_count, is_featured,
      author_name, author_verified, screenshots, published_at
    `)
    .eq('status', 'active')
    .in('id', topModuleIds);

  // Sort by the trending order
  return ((data || []) as ModuleListItem[]).sort((a, b) => {
    const aIndex = topModuleIds.indexOf(a.id);
    const bIndex = topModuleIds.indexOf(b.id);
    return aIndex - bIndex;
  });
}

/**
 * Get new releases (published in last 30 days)
 */
export async function getNewReleases(limit = 6): Promise<ModuleListItem[]> {
  const supabase = createClient();
  
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const { data } = await supabase
    .from('modules_v2')
    .select(`
      id, slug, name, description, icon, category, module_type,
      pricing_type, wholesale_price_monthly, wholesale_price_yearly,
      rating_average, rating_count, install_count, is_featured,
      author_name, author_verified, screenshots, published_at
    `)
    .eq('status', 'active')
    .gte('published_at', thirtyDaysAgo.toISOString())
    .order('published_at', { ascending: false })
    .limit(limit);

  return (data || []) as ModuleListItem[];
}
