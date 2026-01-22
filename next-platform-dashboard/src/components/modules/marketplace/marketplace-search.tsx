'use client';

import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue 
} from '@/components/ui/select';
import { Search, X, SlidersHorizontal, Loader2 } from 'lucide-react';
import { getMainCategories } from '@/lib/modules/module-categories';
import { 
  searchMarketplace, 
  type MarketplaceFilters,
  type MarketplaceSearchResult 
} from '@/lib/modules/marketplace-search';
import { EnhancedModuleCard } from './enhanced-module-card';

interface MarketplaceSearchProps {
  initialFilters?: MarketplaceFilters;
  subscribedModuleIds?: string[];
}

/**
 * MarketplaceSearch Component
 * 
 * IMPORTANT: This component is carefully designed to avoid infinite render loops.
 * - Uses window.history.replaceState() instead of router.replace() to avoid triggering re-renders
 * - All search triggers are debounced
 * - Initial search runs exactly once on mount
 */
export function MarketplaceSearch({ 
  initialFilters,
  subscribedModuleIds = [] 
}: MarketplaceSearchProps) {
  const searchParams = useSearchParams();
  
  // Convert to Set for O(1) lookups (created once via useMemo pattern)
  const subscribedSet = new Set(subscribedModuleIds);
  
  // Initialize filters from URL or props (only once)
  const [filters, setFilters] = useState<MarketplaceFilters>(() => ({
    query: searchParams.get('q') || initialFilters?.query || '',
    categories: (searchParams.get('category')?.split(',').filter(Boolean) || initialFilters?.categories || []) as MarketplaceFilters['categories'],
    priceRange: (searchParams.get('price') as MarketplaceFilters['priceRange']) || initialFilters?.priceRange || 'all',
    sortBy: (searchParams.get('sort') as MarketplaceFilters['sortBy']) || initialFilters?.sortBy || 'popular',
    moduleType: (searchParams.get('type') as MarketplaceFilters['moduleType']) || initialFilters?.moduleType || 'all',
    page: parseInt(searchParams.get('page') || '1') || 1,
    limit: 20
  }));
  
  const [results, setResults] = useState<MarketplaceSearchResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  
  // Refs for cleanup and preventing duplicate searches
  const abortControllerRef = useRef<AbortController | null>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const hasSearchedRef = useRef(false);
  const lastFiltersRef = useRef<string>('');

  // Serialize filters for comparison
  const serializeFilters = (f: MarketplaceFilters): string => {
    return JSON.stringify({
      query: f.query || '',
      categories: f.categories || [],
      priceRange: f.priceRange || 'all',
      sortBy: f.sortBy || 'popular',
      moduleType: f.moduleType || 'all',
      page: f.page || 1
    });
  };

  // Perform search with current filters
  const doSearch = async (searchFilters: MarketplaceFilters) => {
    // Serialize and check if we already searched with these exact filters
    const serialized = serializeFilters(searchFilters);
    if (serialized === lastFiltersRef.current && hasSearchedRef.current) {
      return; // Skip duplicate search
    }
    lastFiltersRef.current = serialized;

    // Cancel any in-flight request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    setLoading(true);
    try {
      const data = await searchMarketplace(searchFilters);
      setResults(data);
      hasSearchedRef.current = true;
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        console.error('Search error:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  // Initial search on mount - runs exactly once
  useEffect(() => {
    doSearch(filters);
    
    return () => {
      // Cleanup on unmount
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty deps = mount only

  // Update filter and trigger debounced search
  const updateFilter = <K extends keyof MarketplaceFilters>(
    key: K, 
    value: MarketplaceFilters[K]
  ) => {
    setFilters(prev => {
      const newFilters = { 
        ...prev, 
        [key]: value, 
        // Reset page to 1 when changing other filters
        page: key === 'page' ? (value as number) : 1 
      };
      
      // Clear previous debounce
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      
      // Debounce the search (300ms for typing, immediate for other filters)
      const delay = key === 'query' ? 300 : 50;
      debounceTimerRef.current = setTimeout(() => {
        doSearch(newFilters);
        updateUrlSilently(newFilters);
      }, delay);
      
      return newFilters;
    });
  };

  // Update URL without triggering re-render (uses native history API)
  const updateUrlSilently = (f: MarketplaceFilters) => {
    const params = new URLSearchParams();
    if (f.query) params.set('q', f.query);
    if (f.categories && f.categories.length > 0) {
      params.set('category', f.categories.join(','));
    }
    if (f.priceRange && f.priceRange !== 'all') {
      params.set('price', f.priceRange);
    }
    if (f.sortBy && f.sortBy !== 'popular') {
      params.set('sort', f.sortBy);
    }
    if (f.moduleType && f.moduleType !== 'all') {
      params.set('type', f.moduleType);
    }
    if (f.page && f.page > 1) {
      params.set('page', f.page.toString());
    }
    
    const queryString = params.toString();
    const newUrl = queryString 
      ? `${window.location.pathname}?${queryString}` 
      : window.location.pathname;
    
    // Use native history API to avoid React re-render
    window.history.replaceState(null, '', newUrl);
  };

  const toggleCategory = (category: string) => {
    const cats = filters.categories || [];
    const newCats = cats.includes(category as typeof cats[number])
      ? cats.filter(c => c !== category)
      : [...cats, category as typeof cats[number]];
    updateFilter('categories', newCats);
  };

  const clearFilters = () => {
    const newFilters: MarketplaceFilters = {
      query: '',
      categories: [],
      priceRange: 'all',
      sortBy: 'popular',
      moduleType: 'all',
      page: 1,
      limit: 20
    };
    setFilters(newFilters);
    
    // Clear debounce and search immediately
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    doSearch(newFilters);
    updateUrlSilently(newFilters);
  };

  const hasActiveFilters = 
    filters.query || 
    (filters.categories?.length || 0) > 0 || 
    filters.priceRange !== 'all' ||
    filters.moduleType !== 'all';

  const activeFilterCount = 
    (filters.categories?.length || 0) + 
    (filters.priceRange !== 'all' ? 1 : 0) +
    (filters.moduleType !== 'all' ? 1 : 0);

  const mainCategories = getMainCategories();

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search modules by name, description, or features..."
            value={filters.query || ''}
            onChange={(e) => updateFilter('query', e.target.value)}
            className="pl-10"
          />
          {filters.query && (
            <button
              onClick={() => updateFilter('query', '')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        
        <Button
          variant={showFilters ? 'secondary' : 'outline'}
          onClick={() => setShowFilters(!showFilters)}
        >
          <SlidersHorizontal className="h-4 w-4 mr-2" />
          Filters
          {activeFilterCount > 0 && (
            <Badge variant="destructive" className="ml-2 h-5 w-5 p-0 flex items-center justify-center text-xs">
              {activeFilterCount}
            </Badge>
          )}
        </Button>
        
        <Select
          value={filters.sortBy || 'popular'}
          onValueChange={(v) => updateFilter('sortBy', v as MarketplaceFilters['sortBy'])}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="popular">Most Popular</SelectItem>
            <SelectItem value="newest">Newest</SelectItem>
            <SelectItem value="rating">Highest Rated</SelectItem>
            <SelectItem value="price-low">Price: Low to High</SelectItem>
            <SelectItem value="price-high">Price: High to Low</SelectItem>
            {filters.query && <SelectItem value="relevance">Relevance</SelectItem>}
          </SelectContent>
        </Select>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="border rounded-lg p-4 space-y-4 bg-muted/30">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Filters</h3>
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <X className="h-4 w-4 mr-1" />
                Clear all
              </Button>
            )}
          </div>
          
          {/* Categories */}
          <div>
            <label className="text-sm font-medium mb-2 block">Categories</label>
            <div className="flex flex-wrap gap-2">
              {mainCategories.map((cat) => (
                <Badge
                  key={cat.slug}
                  variant={filters.categories?.includes(cat.slug) ? 'default' : 'outline'}
                  className="cursor-pointer hover:bg-primary/10 transition-colors"
                  style={filters.categories?.includes(cat.slug) ? { backgroundColor: cat.color } : {}}
                  onClick={() => toggleCategory(cat.slug)}
                >
                  {cat.label}
                </Badge>
              ))}
            </div>
          </div>
          
          {/* Additional Filters Row */}
          <div className="flex flex-wrap gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Price</label>
              <Select
                value={filters.priceRange || 'all'}
                onValueChange={(v) => updateFilter('priceRange', v as MarketplaceFilters['priceRange'])}
              >
                <SelectTrigger className="w-[150px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Prices</SelectItem>
                  <SelectItem value="free">Free Only</SelectItem>
                  <SelectItem value="paid">Paid Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">Module Type</label>
              <Select
                value={filters.moduleType || 'all'}
                onValueChange={(v) => updateFilter('moduleType', v as MarketplaceFilters['moduleType'])}
              >
                <SelectTrigger className="w-[150px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="widget">Widgets</SelectItem>
                  <SelectItem value="app">Apps</SelectItem>
                  <SelectItem value="integration">Integrations</SelectItem>
                  <SelectItem value="system">Full Systems</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Minimum Rating</label>
              <Select
                value={filters.minRating?.toString() || '0'}
                onValueChange={(v) => updateFilter('minRating', parseInt(v) || undefined)}
              >
                <SelectTrigger className="w-[150px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Any Rating</SelectItem>
                  <SelectItem value="4">4+ Stars</SelectItem>
                  <SelectItem value="3">3+ Stars</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Facets Display */}
          {results?.facets && (
            <div className="pt-2 border-t">
              <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                {results.facets.priceRanges.map(({ range, count }) => (
                  <span key={range}>
                    {range === 'free' ? 'Free' : 'Paid'}: {count} modules
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Results Count */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          {loading ? (
            <span className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Searching...
            </span>
          ) : (
            `${results?.total || 0} modules found`
          )}
        </span>
        {results && results.totalPages > 1 && (
          <span>Page {results.page} of {results.totalPages}</span>
        )}
      </div>

      {/* Results Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-64 rounded-lg bg-muted animate-pulse" />
          ))}
        </div>
      ) : results?.modules && results.modules.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {results.modules.map((module) => (
            <EnhancedModuleCard 
              key={module.id} 
              module={module} 
              isSubscribed={subscribedSet.has(module.id)}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-muted-foreground border rounded-lg bg-muted/20">
          <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p className="text-lg font-medium">No modules found</p>
          <p className="text-sm mt-1">Try adjusting your search or filters</p>
          {hasActiveFilters && (
            <Button variant="link" onClick={clearFilters} className="mt-2">
              Clear all filters
            </Button>
          )}
        </div>
      )}

      {/* Pagination */}
      {results && results.totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button
            variant="outline"
            disabled={results.page <= 1}
            onClick={() => updateFilter('page', results.page - 1)}
          >
            Previous
          </Button>
          
          {/* Page numbers */}
          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(5, results.totalPages) }, (_, i) => {
              let pageNum: number;
              if (results.totalPages <= 5) {
                pageNum = i + 1;
              } else if (results.page <= 3) {
                pageNum = i + 1;
              } else if (results.page >= results.totalPages - 2) {
                pageNum = results.totalPages - 4 + i;
              } else {
                pageNum = results.page - 2 + i;
              }
              
              return (
                <Button
                  key={pageNum}
                  variant={pageNum === results.page ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => updateFilter('page', pageNum)}
                >
                  {pageNum}
                </Button>
              );
            })}
          </div>
          
          <Button
            variant="outline"
            disabled={results.page >= results.totalPages}
            onClick={() => updateFilter('page', results.page + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
