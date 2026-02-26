/**
 * E-Commerce Product Grid - Studio Block
 * 
 * Displays a responsive grid of products from the store catalog.
 * Delegates rendering to ProductCardBlock for professional-grade
 * product cards with hover effects, wishlist, and cart integration.
 * 
 * Fetches real data in preview/production mode, shows demo cards in editor.
 */

"use client";

import React, { useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { ComponentDefinition, ResponsiveValue } from "@/types/studio";
import { Loader2, ShoppingBag } from "lucide-react";
import { cn } from "@/lib/utils";
import { useStorefrontProducts } from "../../hooks";
import { useStorefront } from "../../context/storefront-context";
import { ProductCardBlock } from "./product-card-block";

// =============================================================================
// TYPES
// =============================================================================

interface ProductGridProps {
  // Grid settings
  columns: ResponsiveValue<number>;
  gap: ResponsiveValue<string>;
  
  // Product source
  source: "category" | "featured" | "new" | "sale" | "custom";
  categoryId: string | null;
  productIds: string[];
  limit: number;
  
  // Display options
  showPrice: boolean;
  showRating: boolean;
  cardVariant: "card" | "minimal";
  
  // Data (injected by renderer)
  siteId?: string;
  
  // Editor context props (passed by canvas)
  _isEditor?: boolean;
  _siteId?: string;
}

// =============================================================================
// COMPONENT
// =============================================================================

export function ProductGridBlock({
  columns = { mobile: 2, tablet: 3, desktop: 4 },
  gap = { mobile: "16px" },
  source = "featured",
  categoryId: _categoryId,
  productIds: _productIds = [],
  limit = 8,
  showRating = true,
  showPrice = true,
  cardVariant = "card",
  siteId,
  _isEditor = false,
  _siteId,
}: ProductGridProps) {
  // Context
  const storefront = useStorefront();
  const resolvedSiteId = _siteId || siteId || storefront?.siteId || '';

  // Use the storefront products hook for real data
  const { products: realProducts, isLoading: hookLoading } = useStorefrontProducts(resolvedSiteId, {
    categoryId: _categoryId || undefined,
    featured: source === 'featured' ? true : undefined,
    limit,
    sortBy: source === 'new' ? 'newest' : undefined,
  });

  const isLoading = resolvedSiteId ? hookLoading : false;
  const products = realProducts || [];

  const router = useRouter();

  // Navigate to product detail page on click (SPA navigation)
  const handleProductClick = useCallback((productId: string) => {
    const product = products.find(p => p.id === productId);
    const slug = product?.slug || productId;
    router.push(`/products/${slug}`);
  }, [products, router]);

  // Get responsive values
  const columnsValue = typeof columns === "object" ? columns : { mobile: columns, tablet: columns, desktop: columns };
  const gapValue = typeof gap === "object" ? gap.mobile : gap;
  const gapTablet = typeof gap === "object" && gap.tablet ? gap.tablet : gapValue;
  const gapDesktop = typeof gap === "object" && gap.desktop ? gap.desktop : gapTablet;

  // Loading state
  if (isLoading) {
    return (
      <div className="product-grid-wrapper">
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <span className="ml-3 text-muted-foreground text-sm">Loading products...</span>
        </div>
      </div>
    );
  }

  // Empty state
  if (!isLoading && products.length === 0 && resolvedSiteId) {
    return (
      <div className="product-grid-wrapper">
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <ShoppingBag className="h-12 w-12 text-muted-foreground mb-3" />
          <h3 className="font-medium text-lg mb-1">No products found</h3>
          <p className="text-sm text-muted-foreground">
            Products will appear here once they are added to your store.
          </p>
        </div>
      </div>
    );
  }

  // Demo state (no site connected - editor mode)
  if (!resolvedSiteId) {
    const demoCount = Math.min(limit, 8);
    return (
      <div className="product-grid-wrapper">
        <div
          className={cn("product-grid grid")}
          style={{
            gridTemplateColumns: `repeat(${columnsValue.mobile || 2}, 1fr)`,
            gap: gapValue,
          }}
        >
          {Array.from({ length: demoCount }).map((_, i) => (
            <ProductCardBlock
              key={`demo-${i}`}
              productId={null}
              variant={cardVariant === "minimal" ? "minimal" : "card"}
              showPrice={showPrice}
              showRating={showRating}
              showButton={true}
              showWishlistButton={true}
              showQuickView={false}
              showStockBadge={false}
              showSaleBadge={true}
              buttonText="Add to Cart"
              imageAspect="square"
              hoverEffect="zoom"
              padding={{ mobile: "12px" }}
              borderRadius={{ mobile: "8px" }}
            />
          ))}
        </div>
        <style jsx>{`
          @media (min-width: 768px) {
            .product-grid { grid-template-columns: repeat(${columnsValue.tablet || columnsValue.mobile || 2}, 1fr) !important; gap: ${gapTablet} !important; }
          }
          @media (min-width: 1024px) {
            .product-grid { grid-template-columns: repeat(${columnsValue.desktop || columnsValue.tablet || columnsValue.mobile || 2}, 1fr) !important; gap: ${gapDesktop} !important; }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="product-grid-wrapper">
      {/* Product Grid — delegates to ProductCardBlock for rich cards */}
      <div 
        className={cn("product-grid grid")}
        style={{
          gridTemplateColumns: `repeat(${columnsValue.mobile || 2}, 1fr)`,
          gap: gapValue,
        }}
      >
        {products.map((product) => (
          <ProductCardBlock
            key={product.id}
            productId={product.id}
            siteId={resolvedSiteId}
            variant={cardVariant === "minimal" ? "minimal" : "card"}
            showPrice={showPrice}
            showRating={showRating}
            showButton={true}
            showWishlistButton={true}
            showQuickView={false}
            showStockBadge={false}
            showSaleBadge={true}
            buttonText="Add to Cart"
            imageAspect="square"
            hoverEffect="zoom"
            padding={{ mobile: "12px" }}
            borderRadius={{ mobile: "8px" }}
            onProductClick={handleProductClick}
          />
        ))}
      </div>
      
      {/* Responsive CSS */}
      <style jsx>{`
        @media (min-width: 768px) {
          .product-grid {
            grid-template-columns: repeat(${columnsValue.tablet || columnsValue.mobile || 2}, 1fr) !important;
            gap: ${gapTablet} !important;
          }
        }
        @media (min-width: 1024px) {
          .product-grid {
            grid-template-columns: repeat(${columnsValue.desktop || columnsValue.tablet || columnsValue.mobile || 2}, 1fr) !important;
            gap: ${gapDesktop} !important;
          }
        }
      `}</style>
    </div>
  );
}

// =============================================================================
// DEFINITION
// =============================================================================

export const productGridDefinition: Omit<ComponentDefinition, "render"> = {
  type: "EcommerceProductGrid",
  label: "Product Grid",
  description: "Display a grid of products from your catalog",
  category: "ecommerce",
  icon: "LayoutGrid",
  
  fields: {
    columns: {
      type: "number",
      label: "Columns",
      defaultValue: 4,
      min: 1,
      max: 6,
      responsive: true,
    },
    gap: {
      type: "text",
      label: "Gap",
      defaultValue: "16px",
      responsive: true,
    },
    source: {
      type: "select",
      label: "Product Source",
      options: [
        { label: "Featured Products", value: "featured" },
        { label: "New Arrivals", value: "new" },
        { label: "On Sale", value: "sale" },
        { label: "From Category", value: "category" },
        { label: "Custom Selection", value: "custom" },
      ],
      defaultValue: "featured",
    },
    categoryId: {
      type: "text",
      label: "Category ID",
      description: "Required when source is 'From Category'",
      placeholder: "e.g., cat_12345",
    },
    limit: {
      type: "number",
      label: "Product Limit",
      defaultValue: 8,
      min: 1,
      max: 24,
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
    cardVariant: {
      type: "select",
      label: "Card Style",
      options: [
        { label: "Card", value: "card" },
        { label: "Minimal", value: "minimal" },
      ],
      defaultValue: "card",
    },
  },
  
  defaultProps: {
    columns: { mobile: 2, tablet: 3, desktop: 4 },
    gap: { mobile: "16px" },
    source: "featured",
    categoryId: null,
    productIds: [],
    limit: 8,
    showPrice: true,
    showRating: true,
    cardVariant: "card",
  },
  
  ai: {
    description: "Grid displaying multiple products from the e-commerce catalog",
    canModify: ["columns", "limit", "showPrice", "showRating", "cardVariant", "source"],
    suggestions: [
      "Show 4 columns",
      "Display 12 products",
      "Hide ratings",
      "Use minimal card style",
    ],
  },
  
  keywords: ["products", "grid", "catalog", "shop", "store", "ecommerce", "collection", "gallery"],
};
