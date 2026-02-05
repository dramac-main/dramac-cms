/**
 * E-Commerce Product Grid - Studio Block
 * 
 * Displays a grid of products with filtering, sorting, and pagination.
 * Uses real data hooks for live product fetching.
 */

"use client";

import React, { useState, useCallback, useMemo } from "react";
import type { ComponentDefinition, ResponsiveValue } from "@/types/studio";
import { 
  Grid3X3, List, SlidersHorizontal, ChevronLeft, ChevronRight, 
  Loader2, AlertCircle, Search, X
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useStorefrontProducts } from "../../hooks/useStorefrontProducts";
import { useStorefrontCategories } from "../../hooks/useStorefrontCategories";
import { useStorefront } from "../../context/storefront-context";
import { ProductCardBlock } from "./product-card-block";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";

// =============================================================================
// TYPES
// =============================================================================

interface ProductGridProps {
  // Data source
  siteId?: string;
  categoryId?: string;
  
  // Display options
  columns: ResponsiveValue<number>;
  showFilters: boolean;
  showSorting: boolean;
  showPagination: boolean;
  showSearch: boolean;
  showResultCount: boolean;
  productsPerPage: number;
  
  // Card options
  cardVariant: "card" | "horizontal" | "minimal" | "compact";
  showPrice: boolean;
  showRating: boolean;
  showAddToCart: boolean;
  showWishlist: boolean;
  showQuickView: boolean;
  
  // Layout
  gap: ResponsiveValue<string>;
  padding: ResponsiveValue<string>;
  
  // Events
  onProductClick?: (productId: string) => void;
  onQuickView?: (productId: string) => void;
}

// Sort options
const SORT_OPTIONS = [
  { label: "Newest", value: "newest" },
  { label: "Price: Low to High", value: "price-asc" },
  { label: "Price: High to Low", value: "price-desc" },
  { label: "Name: A-Z", value: "name" },
  { label: "Best Selling", value: "popularity" },
];

// =============================================================================
// COMPONENT
// =============================================================================

export function ProductGridBlock({
  siteId,
  categoryId,
  columns = { mobile: 2, tablet: 3, desktop: 4 },
  showFilters = true,
  showSorting = true,
  showPagination = true,
  showSearch = true,
  showResultCount = true,
  productsPerPage = 12,
  cardVariant = "card",
  showPrice = true,
  showRating = true,
  showAddToCart = true,
  showWishlist = true,
  showQuickView = false,
  gap = { mobile: "16px" },
  padding = { mobile: "16px" },
  onProductClick,
  onQuickView,
}: ProductGridProps) {
  // Context
  const storefront = useStorefront();
  const effectiveSiteId = siteId || storefront?.siteId || "";
  
  // Local filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(categoryId);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 10000]);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [onSaleOnly, setOnSaleOnly] = useState(false);
  const [sortBy, setSortBy] = useState<'name' | 'price-asc' | 'price-desc' | 'newest' | 'popularity'>("newest");
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  
  // Fetch products with filters
  const {
    products,
    pagination,
    isLoading,
    error,
    refetch,
  } = useStorefrontProducts(effectiveSiteId, {
    categoryId: selectedCategory,
    search: searchQuery || undefined,
    minPrice: priceRange[0] > 0 ? priceRange[0] : undefined,
    maxPrice: priceRange[1] < 10000 ? priceRange[1] : undefined,
    inStock: inStockOnly || undefined,
    sortBy,
    page: currentPage,
    limit: productsPerPage,
  });
  
  // Fetch categories for filter
  const { categories } = useStorefrontCategories(effectiveSiteId);
  
  // Get responsive values
  const gapValue = typeof gap === "object" ? gap.mobile : gap;
  const paddingValue = typeof padding === "object" ? padding.mobile : padding;
  const columnsValue = typeof columns === "object" ? columns.mobile : columns;
  
  // Calculate grid columns class
  const gridColsClass = useMemo(() => {
    const cols = typeof columns === "object" ? columns : { mobile: columns };
    return cn(
      `grid-cols-${cols.mobile || 2}`,
      cols.tablet && `md:grid-cols-${cols.tablet}`,
      cols.desktop && `lg:grid-cols-${cols.desktop}`
    );
  }, [columns]);
  
  // Handle search
  const handleSearch = useCallback((value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  }, []);
  
  // Handle category change
  const handleCategoryChange = useCallback((value: string) => {
    setSelectedCategory(value === "all" ? undefined : value);
    setCurrentPage(1);
  }, []);
  
  // Handle sort change
  const handleSortChange = useCallback((value: string) => {
    setSortBy(value as 'name' | 'price-asc' | 'price-desc' | 'newest' | 'popularity');
    setCurrentPage(1);
  }, []);
  
  // Handle page change
  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
    // Scroll to top of grid
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);
  
  // Clear all filters
  const clearFilters = useCallback(() => {
    setSearchQuery("");
    setSelectedCategory(categoryId);
    setPriceRange([0, 10000]);
    setInStockOnly(false);
    setOnSaleOnly(false);
    setCurrentPage(1);
  }, [categoryId]);
  
  // Check if any filters are active
  const hasActiveFilters = searchQuery || 
    selectedCategory !== categoryId || 
    priceRange[0] > 0 || 
    priceRange[1] < 10000 || 
    inStockOnly || 
    onSaleOnly;
  
  // Filters sidebar content
  const FiltersContent = () => (
    <div className="space-y-6">
      {/* Categories */}
      {categories.length > 0 && (
        <div>
          <h3 className="font-medium mb-3">Categories</h3>
          <div className="space-y-2">
            <button
              onClick={() => handleCategoryChange("all")}
              className={cn(
                "w-full text-left px-3 py-2 rounded-md text-sm transition-colors",
                !selectedCategory ? "bg-primary text-primary-foreground" : "hover:bg-muted"
              )}
            >
              All Products
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => handleCategoryChange(cat.id)}
                className={cn(
                  "w-full text-left px-3 py-2 rounded-md text-sm transition-colors",
                  selectedCategory === cat.id ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                )}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      )}
      
      {/* Price Range */}
      <div>
        <h3 className="font-medium mb-3">Price Range</h3>
        <div className="px-2">
          <Slider
            value={priceRange}
            onValueChange={(value) => setPriceRange(value as [number, number])}
            min={0}
            max={10000}
            step={10}
            className="mb-4"
          />
          <div className="flex items-center gap-2 text-sm">
            <span>${priceRange[0]}</span>
            <span>-</span>
            <span>${priceRange[1]}</span>
          </div>
        </div>
      </div>
      
      {/* Stock & Sale filters */}
      <div className="space-y-3">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="inStock"
            checked={inStockOnly}
            onCheckedChange={(checked) => setInStockOnly(checked === true)}
          />
          <Label htmlFor="inStock" className="text-sm">In Stock Only</Label>
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox
            id="onSale"
            checked={onSaleOnly}
            onCheckedChange={(checked) => setOnSaleOnly(checked === true)}
          />
          <Label htmlFor="onSale" className="text-sm">On Sale</Label>
        </div>
      </div>
      
      {/* Clear filters */}
      {hasActiveFilters && (
        <Button 
          variant="outline" 
          className="w-full" 
          onClick={clearFilters}
        >
          Clear All Filters
        </Button>
      )}
    </div>
  );

  // Pagination component
  const Pagination = () => {
    if (!pagination || pagination.totalPages <= 1) return null;
    
    const pages = [];
    const maxVisible = 5;
    let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    const end = Math.min(pagination.totalPages, start + maxVisible - 1);
    
    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }
    
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    
    return (
      <div className="flex items-center justify-center gap-2 mt-8">
        <Button
          variant="outline"
          size="icon"
          disabled={currentPage === 1}
          onClick={() => handlePageChange(currentPage - 1)}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        
        {start > 1 && (
          <>
            <Button
              variant={currentPage === 1 ? "default" : "outline"}
              size="sm"
              onClick={() => handlePageChange(1)}
            >
              1
            </Button>
            {start > 2 && <span className="px-2">...</span>}
          </>
        )}
        
        {pages.map((page) => (
          <Button
            key={page}
            variant={currentPage === page ? "default" : "outline"}
            size="sm"
            onClick={() => handlePageChange(page)}
          >
            {page}
          </Button>
        ))}
        
        {end < pagination.totalPages && (
          <>
            {end < pagination.totalPages - 1 && <span className="px-2">...</span>}
            <Button
              variant={currentPage === pagination.totalPages ? "default" : "outline"}
              size="sm"
              onClick={() => handlePageChange(pagination.totalPages)}
            >
              {pagination.totalPages}
            </Button>
          </>
        )}
        
        <Button
          variant="outline"
          size="icon"
          disabled={currentPage === pagination.totalPages}
          onClick={() => handlePageChange(currentPage + 1)}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    );
  };

  return (
    <div style={{ padding: paddingValue }}>
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        {/* Search */}
        {showSearch && (
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-9 pr-9"
            />
            {searchQuery && (
              <button
                onClick={() => handleSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        )}
        
        <div className="flex items-center gap-2 ml-auto">
          {/* Filters button (mobile) */}
          {showFilters && (
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="lg:hidden">
                  <SlidersHorizontal className="h-4 w-4 mr-2" />
                  Filters
                  {hasActiveFilters && (
                    <span className="ml-2 bg-primary text-primary-foreground rounded-full w-5 h-5 text-xs flex items-center justify-center">
                      !
                    </span>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent side="left">
                <SheetHeader>
                  <SheetTitle>Filters</SheetTitle>
                </SheetHeader>
                <div className="mt-6">
                  <FiltersContent />
                </div>
              </SheetContent>
            </Sheet>
          )}
          
          {/* Sort */}
          {showSorting && (
            <Select value={sortBy} onValueChange={handleSortChange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                {SORT_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          
          {/* View mode toggle */}
          <div className="flex border rounded-md">
            <Button
              variant={viewMode === "grid" ? "secondary" : "ghost"}
              size="icon"
              className="rounded-r-none"
              onClick={() => setViewMode("grid")}
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "secondary" : "ghost"}
              size="icon"
              className="rounded-l-none"
              onClick={() => setViewMode("list")}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
      
      {/* Result count */}
      {showResultCount && pagination && (
        <p className="text-sm text-muted-foreground mb-4">
          Showing {products.length} of {pagination.total} products
        </p>
      )}
      
      {/* Main content area */}
      <div className="flex gap-6">
        {/* Desktop filters sidebar */}
        {showFilters && (
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <div className="sticky top-4">
              <h2 className="font-semibold mb-4">Filters</h2>
              <FiltersContent />
            </div>
          </aside>
        )}
        
        {/* Products grid */}
        <div className="flex-1">
          {/* Loading state */}
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          )}
          
          {/* Error state */}
          {error && !isLoading && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <AlertCircle className="h-12 w-12 text-destructive mb-4" />
              <h3 className="font-medium mb-2">Failed to load products</h3>
              <p className="text-sm text-muted-foreground mb-4">{error}</p>
              <Button onClick={() => refetch()}>Try Again</Button>
            </div>
          )}
          
          {/* Empty state */}
          {!isLoading && !error && products.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Search className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="font-medium mb-2">No products found</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Try adjusting your filters or search query
              </p>
              {hasActiveFilters && (
                <Button variant="outline" onClick={clearFilters}>
                  Clear Filters
                </Button>
              )}
            </div>
          )}
          
          {/* Products */}
          {!isLoading && !error && products.length > 0 && (
            <div 
              className={cn(
                viewMode === "grid" ? "grid" : "flex flex-col",
                viewMode === "grid" && gridColsClass
              )}
              style={{ gap: gapValue }}
            >
              {products.map((product) => (
                <ProductCardBlock
                  key={product.id}
                  productId={product.id}
                  siteId={effectiveSiteId}
                  variant={viewMode === "list" ? "horizontal" : cardVariant}
                  showPrice={showPrice}
                  showRating={showRating}
                  showButton={showAddToCart}
                  showWishlistButton={showWishlist}
                  showQuickView={showQuickView}
                  showStockBadge={false}
                  showSaleBadge={true}
                  buttonText="Add to Cart"
                  imageAspect="square"
                  hoverEffect="zoom"
                  padding={{ mobile: "12px" }}
                  borderRadius={{ mobile: "8px" }}
                  onProductClick={onProductClick}
                  onQuickView={onQuickView}
                />
              ))}
            </div>
          )}
          
          {/* Pagination */}
          {showPagination && <Pagination />}
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// DEFINITION
// =============================================================================

export const productGridDefinition: Omit<ComponentDefinition, "render"> = {
  type: "EcommerceProductGrid",
  label: "Product Grid",
  description: "Display a grid of products with filters, sorting, and pagination",
  category: "ecommerce",
  icon: "Grid3X3",
  
  fields: {
    siteId: {
      type: "text",
      label: "Site ID",
      description: "Optional site ID (uses context if not set)",
    },
    categoryId: {
      type: "text",
      label: "Category ID",
      description: "Filter to specific category",
    },
    columns: {
      type: "number",
      label: "Columns",
      defaultValue: 4,
      responsive: true,
    },
    productsPerPage: {
      type: "number",
      label: "Products Per Page",
      defaultValue: 12,
    },
    showFilters: {
      type: "toggle",
      label: "Show Filters",
      defaultValue: true,
    },
    showSorting: {
      type: "toggle",
      label: "Show Sorting",
      defaultValue: true,
    },
    showPagination: {
      type: "toggle",
      label: "Show Pagination",
      defaultValue: true,
    },
    showSearch: {
      type: "toggle",
      label: "Show Search",
      defaultValue: true,
    },
    showResultCount: {
      type: "toggle",
      label: "Show Result Count",
      defaultValue: true,
    },
    cardVariant: {
      type: "select",
      label: "Card Layout",
      options: [
        { label: "Card", value: "card" },
        { label: "Minimal", value: "minimal" },
        { label: "Compact", value: "compact" },
      ],
      defaultValue: "card",
    },
    showPrice: {
      type: "toggle",
      label: "Show Price",
      defaultValue: true,
    },
    showRating: {
      type: "toggle",
      label: "Show Rating",
      defaultValue: true,
    },
    showAddToCart: {
      type: "toggle",
      label: "Show Add to Cart",
      defaultValue: true,
    },
    showWishlist: {
      type: "toggle",
      label: "Show Wishlist",
      defaultValue: true,
    },
    showQuickView: {
      type: "toggle",
      label: "Show Quick View",
      defaultValue: false,
    },
    gap: {
      type: "text",
      label: "Gap",
      defaultValue: "16px",
      responsive: true,
    },
    padding: {
      type: "text",
      label: "Padding",
      defaultValue: "16px",
      responsive: true,
    },
  },
  
  defaultProps: {
    siteId: undefined,
    categoryId: undefined,
    columns: { mobile: 2, tablet: 3, desktop: 4 },
    productsPerPage: 12,
    showFilters: true,
    showSorting: true,
    showPagination: true,
    showSearch: true,
    showResultCount: true,
    cardVariant: "card",
    showPrice: true,
    showRating: true,
    showAddToCart: true,
    showWishlist: true,
    showQuickView: false,
    gap: { mobile: "16px" },
    padding: { mobile: "16px" },
  },
  
  ai: {
    description: "Full product grid with filters, sorting, search, and pagination",
    canModify: [
      "columns", "productsPerPage", "showFilters", "showSorting", 
      "showPagination", "showSearch", "cardVariant", "showPrice",
      "showRating", "showAddToCart", "showWishlist"
    ],
    suggestions: [
      "Show 3 columns on mobile",
      "Hide filters",
      "Use minimal card style",
      "Show 24 products per page",
    ],
  },
  
  keywords: ["products", "grid", "catalog", "shop", "store", "filter", "sort", "browse"],
};
