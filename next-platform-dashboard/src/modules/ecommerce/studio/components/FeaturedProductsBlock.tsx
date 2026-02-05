/**
 * E-Commerce Featured Products - Studio Block
 * 
 * Displays a carousel or row of featured/promoted products.
 * Supports multiple display modes: carousel, row, and hero.
 */

"use client";

import React, { useState, useCallback, useRef, useEffect } from "react";
import type { ComponentDefinition, ResponsiveValue } from "@/types/studio";
import { 
  ChevronLeft, ChevronRight, Loader2, AlertCircle, 
  Sparkles, TrendingUp, Clock, Tag
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useStorefrontProducts } from "../../hooks/useStorefrontProducts";
import { useStorefront } from "../../context/storefront-context";
import { ProductCardBlock } from "./product-card-block";
import { Button } from "@/components/ui/button";

// =============================================================================
// TYPES
// =============================================================================

interface FeaturedProductsProps {
  // Data source
  siteId?: string;
  _siteId?: string | null; // Studio canvas passes this
  productSource: "featured" | "new" | "bestselling" | "sale" | "category" | "manual";
  categoryId?: string;
  productIds?: string[];
  limit: number;
  
  // Display options
  title?: string;
  subtitle?: string;
  showTitle: boolean;
  showViewAll: boolean;
  viewAllLink?: string;
  
  // Layout
  displayMode: "carousel" | "row" | "hero";
  columns: ResponsiveValue<number>;
  cardVariant: "card" | "minimal" | "compact";
  
  // Carousel options
  autoPlay: boolean;
  autoPlayInterval: number;
  showNavigation: boolean;
  showDots: boolean;
  
  // Card options
  showPrice: boolean;
  showRating: boolean;
  showAddToCart: boolean;
  showWishlist: boolean;
  
  // Styling
  gap: ResponsiveValue<string>;
  padding: ResponsiveValue<string>;
  
  // Events
  onProductClick?: (productId: string) => void;
  onViewAllClick?: () => void;
}

// Icons for different sources
const SOURCE_ICONS = {
  featured: Sparkles,
  new: Clock,
  bestselling: TrendingUp,
  sale: Tag,
  category: null,
  manual: null,
};

// Default titles for sources
const SOURCE_TITLES = {
  featured: "Featured Products",
  new: "New Arrivals",
  bestselling: "Best Sellers",
  sale: "On Sale",
  category: "Products",
  manual: "Products",
};

// =============================================================================
// COMPONENT
// =============================================================================

export function FeaturedProductsBlock({
  siteId,
  _siteId,
  productSource = "featured",
  categoryId,
  productIds,
  limit = 8,
  title,
  subtitle,
  showTitle = true,
  showViewAll = true,
  viewAllLink,
  displayMode = "carousel",
  columns = { mobile: 2, tablet: 3, desktop: 4 },
  cardVariant = "card",
  autoPlay = false,
  autoPlayInterval = 5000,
  showNavigation = true,
  showDots = true,
  showPrice = true,
  showRating = true,
  showAddToCart = true,
  showWishlist = true,
  gap = { mobile: "16px" },
  padding = { mobile: "16px" },
  onProductClick,
  onViewAllClick,
}: FeaturedProductsProps) {
  // Context
  const storefront = useStorefront();
  // Use _siteId from Studio canvas, then siteId prop, then context
  const effectiveSiteId = _siteId || siteId || storefront?.siteId || "";
  
  // Carousel state
  const [currentSlide, setCurrentSlide] = useState(0);
  const carouselRef = useRef<HTMLDivElement>(null);
  const autoPlayRef = useRef<NodeJS.Timeout | null>(null);
  
  // Build query options based on source
  const queryOptions = {
    categoryId: productSource === "category" ? categoryId : undefined,
    featured: productSource === "featured" ? true : undefined,
    sortBy: productSource === "new" ? "newest" as const : 
            productSource === "bestselling" ? "popularity" as const : undefined,
    limit,
  };
  
  // Fetch products
  const {
    products: fetchedProducts,
    isLoading,
    error,
    refetch,
  } = useStorefrontProducts(effectiveSiteId, queryOptions);
  
  // If manual, filter to specific product IDs
  const products = productSource === "manual" && productIds?.length 
    ? fetchedProducts.filter(p => productIds.includes(p.id))
    : fetchedProducts;
  
  // Get responsive values
  const gapValue = typeof gap === "object" ? gap.mobile : gap;
  const paddingValue = typeof padding === "object" ? padding.mobile : padding;
  const columnsValue = typeof columns === "object" ? columns.mobile : columns;
  
  // Calculate carousel slides
  const slidesCount = Math.ceil(products.length / columnsValue);
  
  // Auto-play effect
  useEffect(() => {
    if (!autoPlay || displayMode !== "carousel" || slidesCount <= 1) return;
    
    autoPlayRef.current = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % slidesCount);
    }, autoPlayInterval);
    
    return () => {
      if (autoPlayRef.current) {
        clearInterval(autoPlayRef.current);
      }
    };
  }, [autoPlay, autoPlayInterval, displayMode, slidesCount]);
  
  // Navigation handlers
  const goToSlide = useCallback((index: number) => {
    setCurrentSlide(index);
  }, []);
  
  const goToPrev = useCallback(() => {
    setCurrentSlide(prev => (prev - 1 + slidesCount) % slidesCount);
  }, [slidesCount]);
  
  const goToNext = useCallback(() => {
    setCurrentSlide(prev => (prev + 1) % slidesCount);
  }, [slidesCount]);
  
  // Display title
  const displayTitle = title || SOURCE_TITLES[productSource];
  const SourceIcon = SOURCE_ICONS[productSource];

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12" style={{ padding: paddingValue }}>
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }
  
  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center" style={{ padding: paddingValue }}>
        <AlertCircle className="h-12 w-12 text-destructive mb-4" />
        <h3 className="font-medium mb-2">Failed to load products</h3>
        <Button onClick={() => refetch()} size="sm">Try Again</Button>
      </div>
    );
  }
  
  // Empty state
  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center" style={{ padding: paddingValue }}>
        <p className="text-muted-foreground">No products to display</p>
      </div>
    );
  }

  // Grid column class
  const gridColsClass = cn(
    `grid-cols-${columnsValue}`,
    typeof columns === "object" && columns.tablet && `md:grid-cols-${columns.tablet}`,
    typeof columns === "object" && columns.desktop && `lg:grid-cols-${columns.desktop}`
  );

  return (
    <div style={{ padding: paddingValue }}>
      {/* Header */}
      {showTitle && (
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              {SourceIcon && <SourceIcon className="h-6 w-6" />}
              {displayTitle}
            </h2>
            {subtitle && (
              <p className="text-muted-foreground mt-1">{subtitle}</p>
            )}
          </div>
          {showViewAll && (
            <Button
              variant="outline"
              onClick={onViewAllClick}
              asChild={!!viewAllLink}
            >
              {viewAllLink ? (
                <a href={viewAllLink}>View All</a>
              ) : (
                "View All"
              )}
            </Button>
          )}
        </div>
      )}
      
      {/* CAROUSEL Mode */}
      {displayMode === "carousel" && (
        <div className="relative">
          {/* Navigation arrows */}
          {showNavigation && slidesCount > 1 && (
            <>
              <Button
                variant="outline"
                size="icon"
                className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 shadow-md"
                onClick={goToPrev}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 shadow-md"
                onClick={goToNext}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </>
          )}
          
          {/* Carousel container */}
          <div ref={carouselRef} className="overflow-hidden">
            <div 
              className="flex transition-transform duration-500 ease-out"
              style={{ transform: `translateX(-${currentSlide * 100}%)` }}
            >
              {Array.from({ length: slidesCount }).map((_, slideIndex) => (
                <div 
                  key={slideIndex} 
                  className="w-full flex-shrink-0"
                >
                  <div className={cn("grid", gridColsClass)} style={{ gap: gapValue }}>
                    {products
                      .slice(slideIndex * columnsValue, (slideIndex + 1) * columnsValue)
                      .map((product) => (
                        <ProductCardBlock
                          key={product.id}
                          productId={product.id}
                          siteId={effectiveSiteId}
                          variant={cardVariant}
                          showPrice={showPrice}
                          showRating={showRating}
                          showButton={showAddToCart}
                          showWishlistButton={showWishlist}
                          showQuickView={false}
                          showStockBadge={false}
                          showSaleBadge={true}
                          buttonText="Add to Cart"
                          imageAspect="square"
                          hoverEffect="zoom"
                          padding={{ mobile: "12px" }}
                          borderRadius={{ mobile: "8px" }}
                          onProductClick={onProductClick}
                        />
                      ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Dots */}
          {showDots && slidesCount > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              {Array.from({ length: slidesCount }).map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToSlide(index)}
                  className={cn(
                    "w-2.5 h-2.5 rounded-full transition-colors",
                    currentSlide === index 
                      ? "bg-primary" 
                      : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
                  )}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      )}
      
      {/* ROW Mode */}
      {displayMode === "row" && (
        <div className="overflow-x-auto -mx-4 px-4 pb-4">
          <div 
            className="flex"
            style={{ gap: gapValue }}
          >
            {products.map((product) => (
              <div 
                key={product.id}
                className="flex-shrink-0"
                style={{ width: `calc((100% - ${parseInt(gapValue) * (columnsValue - 1)}px) / ${columnsValue})` }}
              >
                <ProductCardBlock
                  productId={product.id}
                  siteId={effectiveSiteId}
                  variant={cardVariant}
                  showPrice={showPrice}
                  showRating={showRating}
                  showButton={showAddToCart}
                  showWishlistButton={showWishlist}
                  showQuickView={false}
                  showStockBadge={false}
                  showSaleBadge={true}
                  buttonText="Add to Cart"
                  imageAspect="square"
                  hoverEffect="zoom"
                  padding={{ mobile: "12px" }}
                  borderRadius={{ mobile: "8px" }}
                  onProductClick={onProductClick}
                />
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* HERO Mode - First product large, others in grid */}
      {displayMode === "hero" && products.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Hero product */}
          <div className="lg:row-span-2">
            <ProductCardBlock
              productId={products[0].id}
              siteId={effectiveSiteId}
              variant="card"
              showPrice={showPrice}
              showRating={showRating}
              showButton={showAddToCart}
              showWishlistButton={showWishlist}
              showQuickView={false}
              showStockBadge={false}
              showSaleBadge={true}
              buttonText="Add to Cart"
              imageAspect="portrait"
              hoverEffect="zoom"
              padding={{ mobile: "16px" }}
              borderRadius={{ mobile: "12px" }}
              onProductClick={onProductClick}
            />
          </div>
          
          {/* Secondary products grid */}
          <div className="grid grid-cols-2 gap-4">
            {products.slice(1, 5).map((product) => (
              <ProductCardBlock
                key={product.id}
                productId={product.id}
                siteId={effectiveSiteId}
                variant="minimal"
                showPrice={showPrice}
                showRating={false}
                showButton={false}
                showWishlistButton={showWishlist}
                showQuickView={false}
                showStockBadge={false}
                showSaleBadge={true}
                buttonText="Add to Cart"
                imageAspect="square"
                hoverEffect="zoom"
                padding={{ mobile: "8px" }}
                borderRadius={{ mobile: "8px" }}
                onProductClick={onProductClick}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// DEFINITION
// =============================================================================

export const featuredProductsDefinition: Omit<ComponentDefinition, "render"> = {
  type: "EcommerceFeaturedProducts",
  label: "Featured Products",
  description: "Display featured, new, or bestselling products in carousel or grid",
  category: "ecommerce",
  icon: "Sparkles",
  
  fields: {
    siteId: {
      type: "text",
      label: "Site ID",
      description: "Optional site ID (uses context if not set)",
    },
    productSource: {
      type: "select",
      label: "Product Source",
      options: [
        { label: "Featured", value: "featured" },
        { label: "New Arrivals", value: "new" },
        { label: "Best Sellers", value: "bestselling" },
        { label: "On Sale", value: "sale" },
        { label: "From Category", value: "category" },
        { label: "Manual Selection", value: "manual" },
      ],
      defaultValue: "featured",
    },
    categoryId: {
      type: "text",
      label: "Category ID",
      description: "Required when source is 'From Category'",
    },
    limit: {
      type: "number",
      label: "Number of Products",
      defaultValue: 8,
    },
    title: {
      type: "text",
      label: "Title",
      description: "Custom title (uses default if empty)",
    },
    subtitle: {
      type: "text",
      label: "Subtitle",
    },
    showTitle: {
      type: "toggle",
      label: "Show Title",
      defaultValue: true,
    },
    showViewAll: {
      type: "toggle",
      label: "Show View All Button",
      defaultValue: true,
    },
    viewAllLink: {
      type: "text",
      label: "View All Link",
    },
    displayMode: {
      type: "select",
      label: "Display Mode",
      options: [
        { label: "Carousel", value: "carousel" },
        { label: "Scrollable Row", value: "row" },
        { label: "Hero Grid", value: "hero" },
      ],
      defaultValue: "carousel",
    },
    columns: {
      type: "number",
      label: "Columns",
      defaultValue: 4,
      responsive: true,
    },
    cardVariant: {
      type: "select",
      label: "Card Style",
      options: [
        { label: "Card", value: "card" },
        { label: "Minimal", value: "minimal" },
        { label: "Compact", value: "compact" },
      ],
      defaultValue: "card",
    },
    autoPlay: {
      type: "toggle",
      label: "Auto Play (Carousel)",
      defaultValue: false,
    },
    autoPlayInterval: {
      type: "number",
      label: "Auto Play Interval (ms)",
      defaultValue: 5000,
    },
    showNavigation: {
      type: "toggle",
      label: "Show Navigation Arrows",
      defaultValue: true,
    },
    showDots: {
      type: "toggle",
      label: "Show Dots",
      defaultValue: true,
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
    productSource: "featured",
    categoryId: undefined,
    productIds: [],
    limit: 8,
    title: undefined,
    subtitle: undefined,
    showTitle: true,
    showViewAll: true,
    viewAllLink: undefined,
    displayMode: "carousel",
    columns: { mobile: 2, tablet: 3, desktop: 4 },
    cardVariant: "card",
    autoPlay: false,
    autoPlayInterval: 5000,
    showNavigation: true,
    showDots: true,
    showPrice: true,
    showRating: true,
    showAddToCart: true,
    showWishlist: true,
    gap: { mobile: "16px" },
    padding: { mobile: "16px" },
  },
  
  ai: {
    description: "Showcase featured, new, or bestselling products in carousel, row, or hero layout",
    canModify: [
      "productSource", "limit", "title", "subtitle", "showTitle",
      "displayMode", "columns", "cardVariant", "autoPlay", "showNavigation",
      "showPrice", "showRating", "showAddToCart"
    ],
    suggestions: [
      "Show new arrivals",
      "Use carousel mode",
      "Display best sellers",
      "Hero layout with sale items",
      "Auto-play carousel",
    ],
  },
  
  keywords: ["featured", "products", "carousel", "new arrivals", "bestsellers", "sale", "showcase"],
};
